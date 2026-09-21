import { Types } from 'mongoose';
import { Brand } from '../models/Brand';
import { Screen } from '../models/Screen';
import { LeanScreen, ScreenDocument } from '../types/screen.types';
import { buildCatalogWorkbookBuffer, CatalogBrandGroup, CatalogPriceColumn } from '../utils/catalogExcel';
import { buildPagination, escapeRegex, parsePagination } from '../utils/query';

const CASE_INSENSITIVE = { locale: 'en', strength: 2 } as const;

export type ScreenPriceInput = {
  salePrice?: number;
  unitSalePrice?: number | null;
  purchasePrice?: number | null;
};

// Columnas de precio que se pueden incluir en el Excel del catálogo, en el
// orden en que se escriben.
export const SCREEN_EXPORT_COLUMNS: Array<CatalogPriceColumn & { key: keyof ScreenPriceInput }> = [
  { key: 'purchasePrice', header: 'PRECIO COMPRA\n(USD)' },
  { key: 'unitSalePrice', header: 'PRECIO UNITARIO\n(USD)' },
  { key: 'salePrice', header: 'PRECIO MAYOR\n(USD)' },
];
export const DEFAULT_SCREEN_EXPORT_COLUMNS = ['salePrice', 'unitSalePrice'];

// El precio de compra es un dato interno: solo lo ven admin y manager.
const COST_FIELD = '-purchasePrice';

export class ScreenService {
  async getScreens(
    filters: any = {},
    canViewCost = false,
  ): Promise<{ data: LeanScreen[]; pagination: any }> {
    const { search, brandId } = filters;
    const { page, limit, skip } = parsePagination(filters.page, filters.limit);

    const query: any = {};
    if (brandId) query.brandId = brandId;
    if (search) {
      const pattern = { $regex: escapeRegex(String(search)), $options: 'i' };
      const matchingBrands = await Brand.find({ name: pattern }).select('_id').lean();
      query.$or = [
        { screenModel: pattern },
        { brandId: { $in: matchingBrands.map((b) => b._id) } },
      ];
    }

    const [screens, total] = await Promise.all([
      Screen.find(query)
        .select(canViewCost ? '' : COST_FIELD)
        .populate('brandId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Screen.countDocuments(query),
    ]);

    return {
      data: screens as unknown as LeanScreen[],
      pagination: buildPagination(page, limit, total),
    };
  }

  async getScreenById(id: string, canViewCost = false): Promise<ScreenDocument> {
    const screen = await Screen.findById(id)
      .select(canViewCost ? '' : COST_FIELD)
      .populate('brandId', 'name');
    if (!screen) throw new Error('Pantalla no encontrada');
    return screen as unknown as ScreenDocument;
  }

  async createScreen(
    data: { brandId: string; screenModel: string; salePrice: number } & ScreenPriceInput,
  ): Promise<ScreenDocument> {
    await this.assertBrandExists(data.brandId);
    await this.assertModelAvailable(data.brandId, data.screenModel);

    const screen = new Screen(data);
    await screen.save();
    await screen.populate('brandId', 'name');
    return screen as unknown as ScreenDocument;
  }

  async updateScreen(
    id: string,
    data: { brandId?: string; screenModel?: string } & ScreenPriceInput,
  ): Promise<ScreenDocument> {
    const screen = await Screen.findById(id);
    if (!screen) throw new Error('Pantalla no encontrada');

    if (data.brandId) await this.assertBrandExists(data.brandId);

    const brandId = data.brandId ?? screen.brandId.toString();
    const screenModel = data.screenModel ?? screen.screenModel;
    if (data.brandId || data.screenModel) await this.assertModelAvailable(brandId, screenModel, id);

    Object.assign(screen, data);
    await screen.save();
    await screen.populate('brandId', 'name');
    return screen as unknown as ScreenDocument;
  }

  async deleteScreen(id: string): Promise<void> {
    const screen = await Screen.findByIdAndDelete(id);
    if (!screen) throw new Error('Pantalla no encontrada');
  }

  // Catálogo en formato "lista de precios": pantallas agrupadas por marca.
  // Sin `brandIds` (o vacío) exporta todas las marcas. `columns` son las claves
  // de precio a incluir (además del modelo, que siempre va).
  async exportScreens(
    brandIds: string[] = [],
    columns: string[] = DEFAULT_SCREEN_EXPORT_COLUMNS,
  ): Promise<Buffer> {
    const priceColumns = SCREEN_EXPORT_COLUMNS.filter((c) => columns.includes(c.key));
    if (priceColumns.length === 0) throw new Error('Selecciona al menos una columna de precio');

    const query = brandIds.length > 0 ? { brandId: { $in: brandIds } } : {};
    const screens = await Screen.find(query).populate('brandId', 'name').lean();

    const byBrand = new Map<string, CatalogBrandGroup>();
    for (const screen of screens as any[]) {
      const brand: string = screen.brandId?.name ?? 'Sin marca';
      if (!byBrand.has(brand)) byBrand.set(brand, { brand, screens: [] });
      byBrand.get(brand)!.screens.push({
        model: screen.screenModel,
        values: Object.fromEntries(priceColumns.map((c) => [c.key, screen[c.key] ?? null])),
      });
    }

    const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
    const groups = [...byBrand.values()].sort((a, b) => collator.compare(a.brand, b.brand));
    groups.forEach((group) => group.screens.sort((a, b) => collator.compare(a.model, b.model)));

    return buildCatalogWorkbookBuffer(groups, priceColumns);
  }

  private async assertBrandExists(brandId: string): Promise<void> {
    const exists = await Brand.exists({ _id: new Types.ObjectId(brandId) });
    if (!exists) throw new Error('La marca seleccionada no existe');
  }

  private async assertModelAvailable(brandId: string, screenModel: string, excludeId?: string): Promise<void> {
    const query: any = { brandId, screenModel: screenModel.trim() };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Screen.findOne(query).collation(CASE_INSENSITIVE).lean();
    if (existing) throw new Error('Ya existe una pantalla con ese modelo en la marca seleccionada');
  }
}

export const screenService = new ScreenService();
