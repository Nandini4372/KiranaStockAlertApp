export interface InventoryItem {
  id?: string;
  name: string;
  category: string;
  brand?: string;
  quantity: number;
  unit: string;
  price: number;
  lowStockThreshold: number;
  ownerId: string;
}

export interface Sale {
  id?: string;
  itemId: string;
  itemName: string;
  quantity: number;
  totalAmount: number;
  timestamp: any;
  ownerId: string;
}

export interface StoreProfile {
  storeName: string;
  ownerName: string;
  address: string;
  ownerId: string;
}
