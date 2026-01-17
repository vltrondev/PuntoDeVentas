import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category_id: '',
    featured: false,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const isEditing = Boolean(id);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const categoriesPromise = supabase.from('categories').select('*').order('name');

        if (isEditing) {
          const productPromise = supabase.from('products').select('*').eq('id', id).single();
          const [{ data: categoriesData, error: catError }, { data: productData, error: prodError }] = await Promise.all([categoriesPromise, productPromise]);

          if (catError) throw catError;
          if (prodError) throw prodError;

          if (categoriesData) setCategories(categoriesData as Category[]);
          if (productData) setProduct(productData);
        } else {
          const { data: categoriesData, error: catError } = await categoriesPromise;
          if (catError) throw catError;
          if (categoriesData) setCategories(categoriesData as Category[]);
        }
      } catch (error) {
        console.error('Error fetching data for product form:', error);
        alert('Error al cargar los datos del formulario.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      setProduct(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'number') {
      setProduct(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setProduct(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = product.image_url;

    if (imageFile) {
      const fileName = `${uuidv4()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(fileName, imageFile);

      if (uploadError) {
        alert(`Error subiendo imagen: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('product_images').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const productDataToSubmit = {
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_id: product.category_id,
      featured: product.featured,
      image_url: imageUrl,
    };

    let error;
    if (isEditing) {
      // Using .select() is a good practice to get the updated data back, even if not used here
      ({ error } = await supabase.from('products').update(productDataToSubmit).eq('id', id).select());
    } else {
      ({ error } = await supabase.from('products').insert(productDataToSubmit).select());
    }

    setLoading(false);
    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      alert(`Producto ${isEditing ? 'actualizado' : 'creado'} con éxito!`);
      navigate('/admin/productos');
    }
  };

  if (loading && isEditing) return <div>Cargando producto...</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
          <input type="text" name="name" id="name" value={product.name} onChange={handleChange} className="input-field mt-1" required />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea name="description" id="description" value={product.description || ''} onChange={handleChange} rows={4} className="input-field mt-1"></textarea>
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">Imagen del Producto</label>
          <input type="file" name="image" id="image" onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" accept="image/*" />
          {product.image_url && !imageFile && <img src={product.image_url} alt="Preview" className="mt-4 h-32 w-32 object-cover rounded-md" />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Precio</label>
            <input type="number" name="price" id="price" value={product.price} onChange={handleChange} className="input-field mt-1" required />
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock (Inventario)</label>
            <input type="number" name="stock" id="stock" value={product.stock} onChange={handleChange} className="input-field mt-1" required />
          </div>
        </div>
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">Categoría</label>
          <select name="category_id" id="category_id" value={product.category_id} onChange={handleChange} className="input-field mt-1" required>
            <option value="">Seleccione una categoría</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary mr-4">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}