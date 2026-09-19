import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PaymentMethod } from './payments.service';

export type ProductType = 'alquiler' | 'venta';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  stock: number;
  minStock: number;
  price: number;
  lowStock: boolean;
}

export interface ProductInput {
  name: string;
  type: ProductType;
  stock: number;
  minStock: number;
  price: number;
}

export interface ProductSale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  amount: number;
  bookingId: string | null;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface ProductSaleInput {
  productId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  bookingId?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/products`;

  getProducts() {
    return this.http.get<Product[]>(this.base);
  }

  createProduct(body: ProductInput) {
    return this.http.post<Product>(this.base, body);
  }

  updateProduct(id: string, body: ProductInput) {
    return this.http.put<Product>(`${this.base}/${id}`, body);
  }

  deleteProduct(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  sellProduct(body: ProductSaleInput) {
    return this.http.post<ProductSale>(`${environment.apiUrl}/product-sales`, body);
  }
}
