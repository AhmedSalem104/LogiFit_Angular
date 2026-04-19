import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Room, CreateRoomRequest, UpdateRoomRequest, RoomType,
  Equipment, CreateEquipmentRequest, UpdateEquipmentRequest, ChangeEquipmentStatusRequest, EquipmentStatus,
  MaintenanceTicket, CreateMaintenanceRequest, ResolveMaintenanceRequest, MaintenanceStatus
} from '../../../shared/models/gym-management.models';

@Injectable({ providedIn: 'root' })
export class FacilitiesService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // Rooms
  listRooms(params?: { branchId?: string; type?: RoomType; isActive?: boolean }): Observable<Room[]> {
    let p = new HttpParams();
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.type !== undefined) p = p.set('type', params.type);
    if (params?.isActive !== undefined) p = p.set('isActive', params.isActive);
    return this.http.get<Room[]>(`${this.api}/Rooms`, { params: p });
  }
  createRoom(body: CreateRoomRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Rooms`, body);
  }
  updateRoom(id: string, body: UpdateRoomRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/Rooms/${id}`, body);
  }
  deleteRoom(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/Rooms/${id}`);
  }

  // Equipment
  listEquipment(params?: {
    branchId?: string; roomId?: string; status?: EquipmentStatus; searchTerm?: string;
  }): Observable<Equipment[]> {
    let p = new HttpParams();
    if (params?.branchId) p = p.set('branchId', params.branchId);
    if (params?.roomId) p = p.set('roomId', params.roomId);
    if (params?.status !== undefined) p = p.set('status', params.status);
    if (params?.searchTerm) p = p.set('searchTerm', params.searchTerm);
    return this.http.get<Equipment[]>(`${this.api}/Equipment`, { params: p });
  }
  createEquipment(body: CreateEquipmentRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Equipment`, body);
  }
  updateEquipment(id: string, body: UpdateEquipmentRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/Equipment/${id}`, body);
  }
  changeEquipmentStatus(id: string, body: ChangeEquipmentStatusRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/Equipment/${id}/status`, body);
  }
  deleteEquipment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/Equipment/${id}`);
  }

  // Maintenance
  listMaintenance(params?: {
    equipmentId?: string; status?: MaintenanceStatus; fromDate?: string; toDate?: string;
  }): Observable<MaintenanceTicket[]> {
    let p = new HttpParams();
    if (params?.equipmentId) p = p.set('equipmentId', params.equipmentId);
    if (params?.status !== undefined) p = p.set('status', params.status);
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<MaintenanceTicket[]>(`${this.api}/Maintenance`, { params: p });
  }
  createMaintenance(body: CreateMaintenanceRequest): Observable<string> {
    return this.http.post<string>(`${this.api}/Maintenance`, body);
  }
  resolveMaintenance(id: string, body: ResolveMaintenanceRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/Maintenance/${id}/resolve`, body);
  }
}
