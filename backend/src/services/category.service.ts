import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { LeanCategory, CategoryDocument } from '../types/category.types';

export class CategoryService {
  async getCategories(filters: any = {}): Promise<{ data: LeanCategory[]; pagination: any }> {
    const { page = 1, limit = 10, search, isActive } = filters;
    
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (isActive !== undefined) query.isActive = isActive;

    const skip = (page - 1) * limit;
    
    const [categories, total] = await Promise.all([
      Category.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Category.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: categories as LeanCategory[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getActiveCategories(): Promise<LeanCategory[]> {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    return categories as LeanCategory[];
  }

  async getCategoryById(id: string): Promise<CategoryDocument> {
    const category = await Category.findById(id);
    if (!category) throw new Error('Categoría no encontrada');
    return category as CategoryDocument;
  }

  async createCategory(data: any): Promise<CategoryDocument> {
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${data.name}$`, 'i') } 
    });
    if (existingCategory) throw new Error('Ya existe una categoría con ese nombre');

    const category = new Category(data);
    await category.save();
    return category as CategoryDocument;
  }

  async updateCategory(id: string, data: any): Promise<CategoryDocument> {
    const category = await Category.findById(id);
    if (!category) throw new Error('Categoría no encontrada');

    if (data.name && data.name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${data.name}$`, 'i') } 
      });
      if (existingCategory) throw new Error('Ya existe una categoría con ese nombre');
    }

    Object.assign(category, data);
    await category.save();
    return category as CategoryDocument;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await Category.findById(id);
    if (!category) throw new Error('Categoría no encontrada');

    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      throw new Error(`No se puede eliminar la categoría porque tiene ${productCount} productos asociados`);
    }

    await Category.findByIdAndDelete(id);
  }
}

export const categoryService = new CategoryService();