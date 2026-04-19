import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ProductCategory, CreateProductCategoryRequest, UpdateProductCategoryRequest,
  Product, CreateProductRequest, UpdateProductRequest,
  StockItem, StockMovement, AdjustStockRequest, TransferStockRequest, StockMovementType,
  Supplier, CreateSupplierRequest, UpdateSupplierRequest,
  Sale, CheckoutRequest, PaymentMethodEnum
} from '../../../shared/models/gym-management.models';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // Product Categories
  listProductCategories(isActive?: boolean): Observable<ProductCategory[]> {
    let p = new HttpParams();
    if (isActive !== undefined) p = p.set('isActive', isActive);
    return this.http.get<ProductCategory[]>(`${this.api}/ProductCategories`, { params: p });
  }
  createProductCategory(body: CreateProductCategoryRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/ProductCategories`, body);
  }
  updateProductCategory(id: string, body: UpdateProductCategoryRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/ProductCategories/${id}`, body);
  }
  deleteProductCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/ProductCategories/${id}`);
  }

  // Products
  listProducts(params?: {
    categoryId?: string; isActive?: boolean; searchTerm?: string; lowStockOnly?: boolean; branchId?: string;
  }): Observable<Product[]> {
    let p = new HttpParams();
    if (params?.categoryId) p = p.set('categoryId', params.categoryId);
    if (params?.isActive !== undefined) p = p.set('isActive', params.isActive);
    if (params?.searchTerm) p = p.set('searchTerm', params.searchTerm);
    if (params?.lowStockOnly !== undefined) p = p.set('lowStockOnly', params.lowStockOnly);
    if (params?.branchId) p = p.set('branchId', params.branchId);
    return this.http.get<Product[]>(`${this.api}/Products`, { params: p });
  }
  createProduct(body: CreateProductRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Products`, body);
  }
  updateProduct(id: string, body: UpdateProductRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/Products/${id}`, body);
  }
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/Products/${id}`);
  }

  // Stock
  listStock(params?: { branchId?: string; productId?: string; lowStockOnly?: boolean }): Observable<StockItem[]> {
    let p = new HttpParams();
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.productId) p = p.set('productId', params.productId);
    if (params?.lowStockOnly !== undefined) p = p.set('lowStockOnly', params.lowStockOnly);
    return this.http.get<StockItem[]>(`${this.api}/Stock`, { params: p });
  }
  listMovements(params?: {
    productId?: string; branchId?: string; type?: StockMovementType; fromDate?: string; toDate?: string;
  }): Observable<StockMovement[]> {
    let p = new HttpParams();
    if (params?.productId) p = p.set('productId', params.productId);
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.type !== undefined) p = p.set('type', params.type);
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<StockMovement[]>(`${this.api}/Stock/movements`, { params: p });
  }
  adjustStock(body: AdjustStockRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/Stock/adjust`, body);
  }
  transferStock(body: TransferStockRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/Stock/transfer`, body);
  }

  // Suppliers
  listSuppliers(params?: { isActive?: boolean; searchTerm?: string }): Observable<Supplier[]> {
    let p = new HttpParams();
    if (params?.isActive !== undefined) p = p.set('isActive', params.isActive);
    if (params?.searchTerm) p = p.set('searchTerm', params.searchTerm);
    return this.http.get<Supplier[]>(`${this.api}/Suppliers`, { params: p });
  }
  createSupplier(body: CreateSupplierRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Suppliers`, body);
  }
  updateSupplier(id: string, body: UpdateSupplierRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/Suppliers/${id}`, body);
  }
  deleteSupplier(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/Suppliers/${id}`);
  }

  // Sales / POS
  listSales(params?: {
    branchId?: string; clientId?: string; cashierId?: string;
    paymentMethod?: PaymentMethodEnum; fromDate?: string; toDate?: string;
  }): Observable<Sale[]> {
    let p = new HttpParams();
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.clientId) p = p.set('clientId', params.clientId);
    if (params?.cashierId) p = p.set('cashierId', params.cashierId);
    if (params?.paymentMethod !== undefined) p = p.set('paymentMethod', params.paymentMethod);
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<Sale[]>(`${this.api}/Sales`, { params: p });
  }
  getSale(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.api}/Sales/${id}`);
  }
  checkout(body: CheckoutRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Sales/checkout`, body);
  }
}
