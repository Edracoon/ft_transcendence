import { catchError, Observable, of, tap, first } from 'rxjs';
import io, { Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export class SocketService {
  socket: Socket;

  constructor(namespace: string) {
    this.socket = io(environment.API_GATAWAY + namespace, {
      extraHeaders: {
        authorization: 'Bearer ' + localStorage.getItem('access_token'),
      },
    });
  }

  listen(eventName: string) {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data: unknown) => subscriber.next(data));
    }).pipe(catchError(this.handleError('socket ERROR')));
  }

  removeListen(eventName: string) {
    this.socket.removeAllListeners(eventName);
  }

  emit(eventName: string, data: unknown) {
    this.socket.emit(eventName, data);
  }

  join(room: string) {
    this.socket.emit('join', room);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }
}
