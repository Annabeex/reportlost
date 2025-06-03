'use client';
import { useState } from 'react';

export default function ReportForm({ defaultCity = '' }: { defaultCity?: string }) {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    city: defaultCity,
    date: '',
    email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Submitted: ' + JSON.stringify(formData, null, 2));
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="category" placeholder="Category" onChange={handleChange} value={formData.category} />
      <input name="description" placeholder="Description" onChange={handleChange} value={formData.description} />
      <input name="city" placeholder="City" onChange={handleChange} value={formData.city} />
      <input name="date" type="date" onChange={handleChange} value={formData.date} />
      <input name="email" type="email" placeholder="Your email" onChange={handleChange} value={formData.email} />
      <button type="submit">Submit</button>
    </form>
  );
}