// Danh mục khởi tạo theo file chi tiêu. ID ổn định khi lưu trên Firestore.
export const EXPENSE_GROUPS = [
  {id:'essential',name:'Sinh hoạt'}, {id:'relationships',name:'Gia đình & quan hệ'},
  {id:'personal',name:'Cá nhân'}, {id:'activities',name:'Hoạt động & sở thích'},
  {id:'other',name:'Khác'},
];
const expense = [
  ['food','Ăn uống','essential','🍜'],['transport','Xe cộ','essential','🚗'],['phone','Điện thoại','essential','📱'],
  ['family','Gia đình','relationships','🏡'],['friends','Bạn bè','relationships','👥'],['dating','Hẹn hò','relationships','❤️'],['social','Giao lưu','relationships','🎉'],
  ['shopping','Mua sắm','personal','🛍️'],['beauty','Làm đẹp','personal','✨'],['spay','SPay','personal','💳'],
  ['pet','Pet','activities','🐾'],['travel','Du lịch','activities','✈️'],['technology','Công nghệ','activities','💻'],['sports','Thể thao','activities','🏋️'],['ocvoivoii','Ocvoivoii','activities','🐌'],
  ['other_expense','Cần phân loại','other','📁'],
];
export const EXPENSE_CATEGORIES = expense.map(([id,name,groupId,icon])=>({id,name,groupId,icon,type:'expense'}));
export const INCOME_CATEGORIES = [
  ['salary','Lương'],['mindx','MindX'],['colorful','Colorful Music'],['pyramid','Pyramid'],['external','Thu ngoài'],['other_income','Thu khác']
].map(([id,name])=>({id,name,groupId:'income',icon:'↙',type:'income'}));
export function getCategoryById(id) {
 return [...EXPENSE_CATEGORIES,...INCOME_CATEGORIES].find(item=>item.id===id) || {id, name:'Không xác định',groupId:'other',icon:'•',type:'expense'};
}
