import { Brand } from '../models/Brand';
import { Phone } from '../models/Phone';
import { LeanBrand, BrandDocument } from '../types/brand.types';
import { buildWorkbookBuffer, DATE_FORMAT } from '../utils/excel';
import { buildPagination, escapeRegex, parsePagination } from '../utils/query';

const CASE_INSENSITIVE = { locale: 'en', strength: 2 } as const;

export class BrandService {
  async getBrands(filters: any = {}): Promise<{ data: LeanBrand[]; pagination: any }> {
    const { search } = filters;
    const { page, limit, skip } = parsePagination(filters.page, filters.limit);

    const query: any = {};
    if (search) query.name = { $regex: escapeRegex(String(search)), $options: 'i' };

    const [brands, total] = await Promise.all([
      Brand.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Brand.countDocuments(query),
    ]);

    return {
      data: brands as LeanBrand[],
      pagination: buildPagination(page, limit, total),
    };
  }

  // Listado completo sin paginar, para alimentar selectores.
  async getAllBrands(): Promise<LeanBrand[]> {
    const brands = await Brand.find().sort({ name: 1 }).lean();
    return brands as LeanBrand[];
  }

  async getBrandById(id: string): Promise<BrandDocument> {
    const brand = await Brand.findById(id);
    if (!brand) throw new Error('Marca no encontrada');
    return brand as BrandDocument;
  }

  async createBrand(data: { name: string }): Promise<BrandDocument> {
    await this.assertNameAvailable(data.name);
    const brand = new Brand(data);
    await brand.save();
    return brand as BrandDocument;
  }

  async updateBrand(id: string, data: { name?: string }): Promise<BrandDocument> {
    const brand = await Brand.findById(id);
    if (!brand) throw new Error('Marca no encontrada');

    if (data.name) await this.assertNameAvailable(data.name, id);

    Object.assign(brand, data);
    await brand.save();
    return brand as BrandDocument;
  }

  async deleteBrand(id: string): Promise<void> {
    const brand = await Brand.findById(id);
    if (!brand) throw new Error('Marca no encontrada');

    const phoneCount = await Phone.countDocuments({ brandId: id });
    if (phoneCount > 0) {
      throw new Error(`No se puede eliminar la marca porque tiene ${phoneCount} teléfonos asociados`);
    }

    await Brand.findByIdAndDelete(id);
  }

  async exportBrands(): Promise<Buffer> {
    const brands = await Brand.find().sort({ name: 1 }).lean();

    return buildWorkbookBuffer(
      'Marcas',
      [
        { header: 'ID', key: 'id', width: 28 },
        { header: 'Marca', key: 'name', width: 30 },
        { header: 'Fecha de creación', key: 'createdAt', width: 20, numFmt: DATE_FORMAT },
        { header: 'Última actualización', key: 'updatedAt', width: 20, numFmt: DATE_FORMAT },
      ],
      brands.map((brand) => ({
        id: brand._id.toString(),
        name: brand.name,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
      })),
    );
  }

  private async assertNameAvailable(name: string, excludeId?: string): Promise<void> {
    const query: any = { name: name.trim() };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Brand.findOne(query).collation(CASE_INSENSITIVE).lean();
    if (existing) throw new Error('Ya existe una marca con ese nombre');
  }
}

export const brandService = new BrandService();
