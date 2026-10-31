import { useState, useEffect } from 'react';

export default function useSocialEvents() {
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('social_events');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse social events', e);
      }
    }
    return [
      { id: '1', name: 'Thành Văn', type: 'wedding', amount: 300000, group: '', date: '2026-10-29', note: '' },
      { id: '2', name: 'Tuấn Thịnh', type: 'wedding', amount: 1000000, group: '', date: '2026-10-29', note: '' },
      { id: '3', name: 'Quỳnh Anh', type: 'wedding', amount: 200000, group: '', date: '2026-10-29', note: '' },
      { id: '4', name: 'Hiền Anh', type: 'wedding', amount: 1000000, group: 'Cấp 3', date: '2026-10-29', note: '' },
      { id: '5', name: 'Hiền Anh', type: 'baby', amount: 200000, group: 'Cấp 3', date: '2026-10-29', note: '' },
      { id: '6', name: 'Trung', type: 'wedding', amount: 2000000, group: 'Cấp 3', date: '2026-10-29', note: '' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('social_events', JSON.stringify(events));
  }, [events]);

  const addEvent = (newEvent) => {
    const itemWithId = { ...newEvent, id: Date.now().toString() };
    setEvents(prev => [itemWithId, ...prev]);
  };

  const updateEvent = (updatedEvent) => {
    setEvents(prev => prev.map(item => item.id === updatedEvent.id ? updatedEvent : item));
  };

  const deleteEvent = (id) => {
    setEvents(prev => prev.filter(item => item.id !== id));
  };

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent
  };
}
