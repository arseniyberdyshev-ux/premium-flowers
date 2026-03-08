'use client'

import { useCart } from '../../store/useCart';
import { products } from '../../data/products';
// 1. Подключаем нашу базу данных к Корзине!
import { supabase } from '../../lib/supabase'; 
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Cart() {
  const { items, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartProducts = items.reduce((acc: any[], item: any) => {
    const product = products.find(p => String(p.id) === String(item.id));
    
    if (product) {
      acc.push({
        ...product,
        price: Number(product.price) || 0,
        quantity: Number(item.quantity) || 1
      });
    }
    return acc;
  }, []);

  const total = cartProducts.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const customerName = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const paymentMethod = formData.get('payment') as string;

    const orderData = {
      customerName,
      phone,
      address,
      paymentMethod,
      items: cartProducts
    };

    try {
      // 2. МАГИЯ БАЗЫ ДАННЫХ: Сначала сохраняем заказ в Supabase
      const { error: dbError } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: customerName,
            phone: phone,
            address: address,
            payment_method: paymentMethod,
            total_price: total,
            items: cartProducts
          }
        ]);

      if (dbError) {
        console.error('Ошибка сохранения в базу:', dbError);
        // Если база недоступна, всё равно попытаемся отправить в Telegram
      }

      // 3. Отправляем уведомление курьеру в Telegram
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        clearCart();
        alert('Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.');
      } else {
        throw new Error('Ошибка при отправке в Telegram');
      }
    } catch (error) {
      console.error(error);
      alert('Ошибка при отправке заказа. Проверьте настройки бота.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (items.length === 0 || cartProducts.length === 0) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F9FAFB_0%,#E8EBEE_27%,#E0E6EB_51%,#EAEDF0_78%,#F9FAFB_100%)] flex flex-col items-center justify-center p-8 text-gray-900">
        <div className="bg-white/60 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/50 text-center flex flex-col items-center">
            <span className="text-5xl mb-6">🛒</span>
            <p className="text-lg text-gray-500 mb-8 uppercase tracking-[0.2em] font-light">Корзина пуста</p>
            <Link href="/" className="px-8 py-4 bg-rose-300 text-white rounded-2xl text-xs uppercase tracking-widest hover:bg-rose-400 hover:shadow-md hover:-translate-y-0.5 transition-all font-bold">
              Вернуться к витрине
            </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F9FAFB_0%,#E8EBEE_27%,#E0E6EB_51%,#EAEDF0_78%,#F9FAFB_100%)] p-6 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto">
          <header className="mb-8 flex justify-between items-center pt-4">
            <h1 className="text-2xl tracking-[0.2em] uppercase font-light text-gray-800 drop-shadow-sm bg-white/40 px-6 py-2 rounded-2xl backdrop-blur-md shadow-sm border border-white/50">
                Оформление
            </h1>
            <button 
              onClick={clearCart} 
              className="text-xs uppercase tracking-widest text-gray-400 hover:text-rose-400 transition-colors mr-4 ml-auto font-medium bg-white/40 px-4 py-2 rounded-xl"
            >
              Очистить всё
            </button>
            <Link href="/" className="bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm hover:shadow-md hover:bg-white transition-all text-sm uppercase tracking-widest font-medium text-gray-700 border border-white/50">
              Назад
            </Link>
          </header>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-7 bg-white/60 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/50 h-fit">
              <h2 className="text-xs uppercase tracking-widest mb-6 text-gray-500 font-semibold border-b border-white/50 pb-4">Ваш заказ</h2>
              <div className="space-y-4">
                {cartProducts.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-white/40 p-4 rounded-2xl border border-white/40 hover:shadow-sm transition-all group">
                    <div className="flex gap-5 items-center">
                       <div className="w-20 h-24 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex flex-col">
                        <p className="font-medium text-sm text-gray-800 mb-1">{p.name}</p>
                        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Кол-во: {p.quantity}</p>
                        <button 
                          onClick={() => removeItem(p.id)} 
                          className="text-[10px] text-rose-400 uppercase tracking-widest hover:text-rose-600 transition-colors self-start font-bold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg opacity-90 group-hover:opacity-100"
                        >
                          ✕ Удалить
                        </button>
                       </div>
                    </div>
                    <p className="text-lg font-light text-gray-800 whitespace-nowrap bg-white/50 px-4 py-2 rounded-xl border border-white/40 shadow-sm">
                      {(p.price * p.quantity).toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm">
                <div className="space-y-3 mb-4 text-sm text-gray-600 border-b border-white/60 pb-4">
                  <div className="flex justify-between">
                    <span>Товары ({cartProducts.reduce((sum, item) => sum + item.quantity, 0)} шт.)</span>
                    <span>{total.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Доставка</span>
                    <span className="text-emerald-500 font-medium">Бесплатно</span>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">ИТОГО К ОПЛАТЕ:</span>
                  <span className="text-3xl text-gray-900 font-light drop-shadow-sm">{total.toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
            </section>

            <section className="lg:col-span-5 bg-white/60 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/50 h-fit">
              <h2 className="text-xs uppercase tracking-widest mb-6 text-gray-500 font-semibold border-b border-white/50 pb-4">Куда везти?</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 ml-2 font-bold">Имя получателя</label>
                  <input name="name" required className="w-full bg-white/70 border border-white shadow-sm p-4 rounded-2xl text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all placeholder:text-gray-400" placeholder="Например, Анна" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 ml-2 font-bold">Телефон</label>
                  <input name="phone" required type="tel" className="w-full bg-white/70 border border-white shadow-sm p-4 rounded-2xl text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all placeholder:text-gray-400" placeholder="+7 (999) 000-00-00" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 ml-2 font-bold">Адрес доставки</label>
                  <textarea name="address" required rows={3} className="w-full bg-white/70 border border-white shadow-sm p-4 rounded-2xl text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all resize-none placeholder:text-gray-400" placeholder="Улица, дом, квартира..." />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 ml-2 font-bold">Оплата</label>
                  <select name="payment" className="w-full bg-white/70 border border-white shadow-sm p-4 rounded-2xl text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all appearance-none cursor-pointer text-gray-700">
                    <option value="Перевод">Перевод на карту</option>
                    <option value="Наличные">Наличные курьеру</option>
                  </select>
                </div>

                <button 
                  disabled={loading} 
                  className="w-full bg-rose-300 text-white py-5 mt-4 rounded-2xl uppercase tracking-[0.2em] text-xs font-bold hover:bg-rose-400 hover:shadow-lg hover:shadow-rose-200 transition-all disabled:bg-gray-300 active:scale-[0.98]"
                >
                  {loading ? 'Отправляем...' : 'Оформить заказ'}
                </button>
              </form>
            </section>
          </div>
      </div>
    </main>
  );
}