'use client'

import { useCart } from '../store/useCart';
// Подключаем наш новый мост к базе данных!
import { supabase } from '../lib/supabase'; 
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { items, addItem } = useCart();
  const [addedId, setAddedId] = useState<number | null>(null);
  
  // Создаем хранилище для букетов из базы и индикатор загрузки
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Магия: при открытии сайта идем в Supabase и забираем товары
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id'); // сортируем по номеру, чтобы шли по порядку
        
      if (error) {
        console.error('Ошибка при загрузке из БД:', error);
      } else {
        setProducts(data || []);
      }
      setIsLoading(false); // Выключаем анимацию загрузки
    }
    
    fetchProducts();
  }, []);

  const handleAddToCart = (product: any) => {
    addItem(product.id);
    setAddedId(product.id);
    setTimeout(() => {
      setAddedId(null);
    }, 1500);
  };

  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F9FAFB_0%,#E8EBEE_27%,#E0E6EB_51%,#EAEDF0_78%,#F9FAFB_100%)] p-6 font-sans text-gray-900 overflow-x-hidden">
      
      {/* ВОЗДУШНАЯ ШАПКА */}
      <header className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-16 pt-6 sticky top-2 z-50">
        <h1 className="text-3xl tracking-[0.3em] uppercase font-light text-gray-800 mb-4 md:mb-0 drop-shadow-sm">
          L'AURA
        </h1>
        <nav className="flex gap-6 md:gap-10 text-[11px] uppercase tracking-widest font-medium text-gray-500 mb-4 md:mb-0 bg-white/40 px-8 py-3 rounded-full backdrop-blur-md border border-white/50 shadow-sm">
          <Link href="/" className="hover:text-rose-400 transition-colors">Каталог</Link>
          <Link href="#about" className="hover:text-rose-400 transition-colors">О нас</Link>
          <Link href="#delivery" className="hover:text-rose-400 transition-colors">Доставка</Link>
        </nav>
        <Link 
          href="/cart" 
          className={`relative bg-white/60 backdrop-blur-md px-6 py-3 rounded-full shadow-sm hover:shadow-md hover:bg-white transition-all duration-300 text-[11px] uppercase tracking-widest font-bold text-gray-700 border border-white/50 ${addedId ? 'scale-105 shadow-rose-200' : ''}`}
        >
          Корзина
          {totalItems > 0 && (
            <>
              {addedId && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-400 rounded-full animate-ping opacity-75"></span>
              )}
              <span className="absolute -top-1 -right-1 bg-rose-400 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                {totalItems}
              </span>
            </>
          )}
        </Link>
      </header>
      
      {/* КРАСИВАЯ ЗАГРУЗКА ИЛИ КАТАЛОГ */}
      {isLoading ? (
        <div className="max-w-5xl mx-auto flex justify-center items-center h-64">
           {/* Анимация крутящегося кружка */}
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400"></div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(p => (
            <div 
              key={p.id} 
              className={`bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden flex flex-col transition-all duration-500 ${
                addedId === p.id 
                  ? 'border-2 border-emerald-300 shadow-2xl shadow-emerald-100/60 scale-[1.02] -translate-y-2' 
                  : 'border border-white/50 shadow-sm hover:shadow-xl hover:shadow-rose-100/50 hover:-translate-y-1'
              }`}
            >
              <div className="w-full h-80 overflow-hidden bg-gray-50 relative">
                 <img 
                    src={p.image} 
                    alt={p.name} 
                    className={`w-full h-full object-cover transition-transform duration-700 ${addedId === p.id ? 'scale-110' : 'hover:scale-105'}`} 
                 />
                 <div className={`absolute inset-0 bg-emerald-400/10 transition-opacity duration-300 pointer-events-none ${addedId === p.id ? 'opacity-100' : 'opacity-0'}`}></div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow justify-between relative bg-white/40">
                <div>
                  <h2 className="text-lg font-medium text-gray-800 mb-1">{p.name}</h2>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Артикул: {p.id}</p>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xl font-light text-gray-900 drop-shadow-sm">
                    {p.price.toLocaleString('ru-RU')} ₽
                  </span>
                  
                  <button 
                    onClick={() => handleAddToCart(p)}
                    className={`px-5 py-3 rounded-xl text-[11px] uppercase tracking-widest transition-all duration-300 font-bold overflow-hidden relative ${
                      addedId === p.id 
                      ? 'bg-emerald-400 text-white shadow-lg shadow-emerald-200 scale-105' 
                      : 'bg-rose-300 text-white hover:bg-rose-400 hover:shadow-md hover:shadow-rose-300/40 active:scale-95'
                    }`}
                  >
                    {addedId === p.id ? 'В КОРЗИНЕ ✓' : 'В корзину'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}