import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';

export default function Items() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function fetchItems() {
      const { data, error } = await supabase.from('your_table').select();
      if (!error) setItems(data);
    }
    fetchItems();
  }, []);

  return (
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}