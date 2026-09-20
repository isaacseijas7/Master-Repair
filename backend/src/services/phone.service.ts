import { Types } from 'mongoose';
import { Brand } from '../models/Brand';
import { Phone } from '../models/Phone';
import { LeanPhone, PhoneDocument } from '../types/phone.types';
import { buildWorkbookBuffer, DATE_FORMAT, USD_FORMAT } from '../utils/excel';
import { buildPagination, escapeRegex, parsePagination } from '../utils/query';

const CASE_INSENSITIVE = { locale: 'en', strength: 2 } as const;

export class PhoneService {
  async getPhones(filters: any = {}): Promise<{ data: LeanPhone[]; pagination: any }> {
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

  async getPhoneById(id: string): Promise<PhoneDocument> {
    const phone = await Phone.findById(id).populate('brandId', 'name');
    if (!phone) throw new Error('Teléfono no encontrado');
    return phone as unknown as PhoneDocument;
  }

  async createPhone(data: { brandId: string; phoneModel: string; salePrice: number }): Promise<PhoneDocument> {
    await this.assertBrandExists(data.brandId);
    await this.assertModelAvailable(data.brandId, data.phoneModel);

    const phone = new Phone(data);
    await phone.save();
    await phone.populate('brandId', 'name');
    return phone as unknown as PhoneDocument;
  }

  async updatePhone(
    id: string,
    data: { brandId?: string; phoneModel?: string; salePrice?: number },
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

  async exportPhones(): Promise<Buffer> {
    const phones = await Phone.find().populate('brandId', 'name').lean();

    const rows = phones
      .map((phone: any) => ({
        brand: phone.brandId?.name ?? '-',
        phoneModel: phone.phoneModel,
        salePrice: phone.salePrice,
        createdAt: phone.createdAt,
        updatedAt: phone.updatedAt,
      }))
      .sort(
        (a, b) =>
          a.brand.localeCompare(b.brand, 'es', { sensitivity: 'base' }) ||
          a.phoneModel.localeCompare(b.phoneModel, 'es', { sensitivity: 'base' }),
      );

    return buildWorkbookBuffer(
      'Teléfonos',
      [
        { header: 'Marca', key: 'brand', width: 25 },
        { header: 'Modelo', key: 'phoneModel', width: 35 },
        { header: 'Precio de venta (USD)', key: 'salePrice', width: 22, numFmt: USD_FORMAT },
        { header: 'Fecha de creación', key: 'createdAt', width: 20, numFmt: DATE_FORMAT },
        { header: 'Última actualización', key: 'updatedAt', width: 20, numFmt: DATE_FORMAT },
      ],
      rows,
    );
  }

  private async assertBrandExists(brandId: string): Promise<void> {
    const exists = await Brand.exists({ _id: new Types.ObjectId(brandId) });
    if (!exists) throw new Error('La marca seleccionada no existe');
  }

  private async assertModelAvailable(brandId: string, phoneModel: string, excludeId?: string): Promise<void> {
    const query: any = { brandId, phoneModel: phoneModel.trim() };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Phone.findOne(query).collation(CASE_INSENSITIVE).lean();
    if (existing) throw new Error('Ya existe un teléfono con ese modelo en la marca seleccionada');
  }
}

export const phoneService = new PhoneService();
