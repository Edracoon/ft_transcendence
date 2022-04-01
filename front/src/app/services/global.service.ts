import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, Subject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Ladder } from '../models/ladder';
import { User } from '../models/user';
import { UserSocketService } from './user-socket.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class GlobalService {
  title = 'infinity';
  endpoint: string = environment.API_INFINITY + '/api/';
  ladders: Ladder[] = [];
  onLaddersChanged = new Subject<Ladder[]>();

  constructor(
    private readonly httpClient: HttpClient,
    private userSocketService: UserSocketService,
    private userService: UserService
  ) {
    console.log('# Start GlobalService');
    this.uploadLadder();
    this.userService.getIntraFromToken().subscribe((id) => {
      this.userSocketService.listen('notif_ladder').subscribe((data) => {
        this.uploadLadder();
        let gamers = data as number[];
        if (gamers.find((user_id) => user_id == id))
          this.userService.uploadCurrentUser();
      });
    });
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.log(error);
      return of(result as T);
    };
  }

  getTitle() {
    return of(this.title);
  }

  uploadLadder() {
    this.getLadder().subscribe((ladders) => {
      this.ladders = ladders;
      this.onLaddersChanged.next(ladders);
    });
  }

  getLadder() {
    return this.httpClient.get<Ladder[]>(this.endpoint + 'game/ladder').pipe(
      tap((_) => {
        console.log('get ladder');
      }),
      catchError(this.handleError<Ladder[]>('getLadder'))
    );
  }
}
