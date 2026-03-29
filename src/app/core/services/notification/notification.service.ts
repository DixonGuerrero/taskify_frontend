import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import * as SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';
import { environment } from '../../../../environments/environment.development';
import { Notification } from '../../models/notification/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private stompClient: any = null;
  private notificationSubject = new Subject<Notification>();
  private apiUrl: string = environment.API_URL;

  constructor(private http: HttpClient) {}

  connect(userId: number): void {
    if (this.stompClient?.connected) {
      console.log('WebSocket ya está conectado');
      this.subscribeToNotifications(userId); // Re-suscribirse si ya está conectado
      return;
    }

    const ws = new SockJS.default(this.apiUrl + '/ws');
    this.stompClient = Stomp.over(ws);

    this.stompClient.connect(
      {},
      (frame: any) => {
        console.log('Conectado al WebSocket:', frame);
        this.subscribeToNotifications(userId);
      },
      (error: any) => {
        console.error('Error en la conexión WebSocket:', error);
      }
    );
  }

  private subscribeToNotifications(userId: number): void {
    if (!this.stompClient) {
      console.error('STOMP client no está inicializado');
      return;
    }

    const destination = `/user/${userId}/notification`;
    this.stompClient.subscribe(destination, (message: any) => {
      const payload: Notification = JSON.parse(message.body);
      console.log('Notificación recibida:', payload);
      this.notificationSubject.next(payload);
    });
  }

  getNotifications(): Observable<Notification> {
    return this.notificationSubject.asObservable();
  }

  getUnreadNotifications(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notification/v1/unread/${userId}`);
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/notification/v1/mark-as-read/${notificationId}`, {});
  }

  markAllAsRead(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/notification/v1/mark-all-as-read/${userId}`, {});
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        console.log('WebSocket desconectado');
      });
      this.stompClient = null;
    }
  }
}