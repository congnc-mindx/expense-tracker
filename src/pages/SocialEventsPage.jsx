import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import SocialEventModal from '../components/finance/SocialEventModal';
import useSocialEvents from '../hooks/useSocialEvents';

export default function SocialEventsPage() {
  const { events, addEvent, updateEvent, deleteEvent } = useSocialEvents();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (event.group && event.group.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || event.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalAmount = filteredEvents.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Hiếu Hỉ & Sự kiện</h1>
          <p className="text-sm text-gray-500">Theo dõi tiền mừng cưới, thăm con, đám ma (đi và nhận)</p>
        </div>
        <button
          onClick={() => { setEditingEvent(null); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="w-4 h-4 mr-2" /> Thêm khoản giao dịch
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Tổng giá trị lọc</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {totalAmount.toLocaleString('vi-VN')} đ
          </dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Tổng số bản ghi</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {filteredEvents.length}
          </dd>
        </div>
      </div>

      <div className="bg-white p-4 shadow rounded-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên người hoặc nhóm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full sm:w-auto py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="all">Tất cả loại sự kiện</option>
            <option value="wedding">Mừng cưới</option>
            <option value="baby">Thăm con / Đầy tháng</option>
            <option value="funeral_out">Tôi đi đám ma (Chi)</option>
            <option value="funeral_in">Họ đi đám ma nhà tôi (Thu)</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và Tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại sự kiện</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền (VNĐ)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhóm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    Chưa có dữ liệu nào. Hãy bấm "Thêm khoản giao dịch" để bắt đầu.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.type === 'wedding' ? 'bg-pink-100 text-pink-800' :
                        item.type === 'baby' ? 'bg-blue-100 text-blue-800' :
                        item.type === 'funeral_out' ? 'bg-gray-100 text-gray-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.type === 'wedding' ? 'Mừng cưới' :
                         item.type === 'baby' ? 'Thăm con' :
                         item.type === 'funeral_out' ? 'Đi đám ma' : 'Họ đi đám ma'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      {Number(item.amount || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.group || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date || new Date().toISOString().split('T')[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => { setEditingEvent(item); setIsModalOpen(true); }}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => deleteEvent(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <SocialEventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => {
            if (editingEvent) {
              updateEvent({ ...editingEvent, ...data });
            } else {
              addEvent(data);
            }
            setIsModalOpen(false);
          }}
          initialData={editingEvent}
        />
      )}
    </div>
  );
}
