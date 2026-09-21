import { Types } from 'mongoose';
import { Brand } from '../models/Brand';
import { Phone } from '../models/Phone';
import { LeanPhone, PhoneDocument } from '../types/phone.types';
import { buildCatalogWorkbookBuffer, CatalogBrandGroup, CatalogPriceColumn } from '../utils/catalogExcel';
import { buildPagination, escapeRegex, parsePagination } from '../utils/query';

const CASE_INSENSITIVE = { locale: 'en', strength: 2 } as const;

export type PhonePriceInput = {
  salePrice?: number;
  unitSalePrice?: number | null;
  purchasePrice?: number | null;
};

// Columnas de precio que se pueden incluir en el Excel del catálogo, en el
// orden en que se escriben.
export const PHONE_EXPORT_COLUMNS: Array<CatalogPriceColumn & { key: keyof PhonePriceInput }> = [
  { key: 'purchasePrice', header: 'PRECIO COMPRA\n(USD)' },
  { key: 'unitSalePrice', header: 'PRECIO UNITARIO\n(USD)' },
  { key: 'salePrice', header: 'PRECIO MAYOR\n(USD)' },
];
export const DEFAULT_PHONE_EXPORT_COLUMNS = ['salePrice', 'unitSalePrice'];

// El precio de compra es un dato interno: solo lo ven admin y manager.
const COST_FIELD = '-purchasePrice';

export class PhoneService {
  async getPhones(
    filters: any = {},
    canViewCost = false,
  ): Promise<{ data: LeanPhone[]; pagination: any }> {
    const { search, brandId } = filters;
    const { page, limit, skip } = parsePagination(filters.page, filters.limit);

    const query: any = {};
    if (brandId) query.brandId = brandId;
    if (search) {
      const pattern = { $regex: escapeRegex(String(search)), $options: 'i' };
      const matchingBrands = await Brand.find({ name: pattern }).select('_id').lean();
      query.$or = [
        { phoneModel: pattern },
        { brandId: { $in: matchingBrands.map((b) => b._id) } },
      ];
    }

    const [phones, total] = await Promise.all([
      Phone.find(query)
        .select(canViewCost ? '' : COST_FIELD)
        .populate('brandId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Phone.countDocuments(query),
    ]);

    return {
      data: phones as unknown as LeanPhone[],
      pagination: buildPagination(page, limit, total),
    };
  }

  async getPhoneById(id: string, canViewCost = false): Promise<PhoneDocument> {
    const phone = await Phone.findById(id)
      .select(canViewCost ? '' : COST_FIELD)
      .populate('brandId', 'name');
    if (!phone) throw new Error('Teléfono no encontrado');
    return phone as unknown as PhoneDocument;
  }

  async createPhone(
    data: { brandId: string; phoneModel: string; salePrice: number } & PhonePriceInput,
  ): Promise<PhoneDocument> {
    await this.assertBrandExists(data.brandId);
    await this.assertModelAvailable(data.brandId, data.phoneModel);

    const phone = new Phone(data);
    await phone.save();
    await phone.populate('brandId', 'name');
    return phone as unknown as PhoneDocument;
  }

  async updatePhone(
    id: string,
    data: { brandId?: string; phoneModel?: string } & PhonePriceInput,
  ): Promise<PhoneDocument> {
    const phone = await Phone.findById(id);
    if (!phone) throw new Error('Teléfono no encontrado');

    if (data.brandId) await this.assertBrandExists(data.brandId);

    const brandId = data.brandId ?? phone.brandId.toString();
    const phoneModel = data.phoneModel ?? phone.phoneModel;
    if (data.brandId || data.phoneModel) await this.assertModelAvailable(brandId, phoneModel, id);

    Object.assign(phone, data);
    await phone.save();
    await phone.populate('brandId', 'name');
    return phone as unknown as PhoneDocument;
  }

  async deletePhone(id: string): Promise<void> {
    const phone = await Phone.findByIdAndDelete(id);
    if (!phone) throw new Error('Teléfono no encontrado');
  }

  // Catálogo en formato "lista de precios": pantallas agrupados por marca.
  // Sin `brandIds` (o vacío) exporta todas las marcas. `columns` son las claves
  // de precio a incluir (además del modelo, que siempre va).
  async exportPhones(
    brandIds: string[] = [],
    columns: string[] = DEFAULT_PHONE_EXPORT_COLUMNS,
  ): Promise<Buffer> {
    const priceColumns = PHONE_EXPORT_COLUMNS.filter((c) => columns.includes(c.key));
    if (priceColumns.length === 0) throw new Error('Selecciona al menos una columna de precio');

    const query = brandIds.length > 0 ? { brandId: { $in: brandIds } } : {};
    const phones = await Phone.find(query).populate('brandId', 'name').lean();

    const byBrand = new Map<string, CatalogBrandGroup>();
    for (const phone of phones as any[]) {
      const brand: string = phone.brandId?.name ?? 'Sin marca';
      if (!byBrand.has(brand)) byBrand.set(brand, { brand, phones: [] });
      byBrand.get(brand)!.phones.push({
        model: phone.phoneModel,
        values: Object.fromEntries(priceColumns.map((c) => [c.key, phone[c.key] ?? null])),
      });
    }

    const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
    const groups = [...byBrand.values()].sort((a, b) => collator.compare(a.brand, b.brand));
    groups.forEach((group) => group.phones.sort((a, b) => collator.compare(a.model, b.model)));

    return buildCatalogWorkbookBuffer(groups, priceColumns);
  }

  private async assertBrandExists(brandId: string): Promise<void> {
    const exists = await Brand.exists({ _id: new Types.ObjectId(brandId) });
    if (!exists) throw new Error('La marca seleccionada no existe');
  }

  private async assertModelAvailable(brandId: string, phoneModel: string, excludeId?: string): Promise<void> {
    const query: any = { brandId, phoneModel: phoneModel.trim() };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Phone.findOne(query).collation(CASE_INSENSITIVE).lean();
    if (existing) throw new Error('Ya existe un pantalla con ese modelo en la marca seleccionada');
  }
}

export const phoneService = new PhoneService();
