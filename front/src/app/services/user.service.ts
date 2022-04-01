import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, filter, map, Observable, of, Subject, tap } from 'rxjs';
import { User, UserStatus } from '../models/user';
import { Game } from '../models/game';
import { UserUpdateDto } from '../models/user-update.dto';
import { ActionCategory, Action } from '../models/action';
import { UserSocketService } from './user-socket.service';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Achievement } from '../models/achievement';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  currentUser?: User;
  endpoint: string = environment.API_INFINITY + '/api/user/';
  onUserChanged = new Subject<User>();

  constructor(
    private http: HttpClient,
    private userSocketService: UserSocketService,
    private authService: AuthService,
    private router: Router
  ) {
    console.log('# Start UserService');
    this.uploadCurrentUser();
    this.userSocketService.listen('notif_user').subscribe(() => {
      this.uploadCurrentUser();
    });
    this.router.events.subscribe((event) => {
      if (
        event instanceof NavigationEnd &&
        localStorage.getItem('access_token')
      ) {
        this.uploadCurrentUser();
      }
    });
  }

  uploadCurrentUser() {
    this.getCurrentUser().subscribe((user) => {
      this.currentUser = user;
      console.log('user uploaded');
      this.onUserChanged.next(user);
    });
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.log(error);
      return of(result as T);
    };
  }

  getHistory(id: number, defeats: Game[], victorires: Game[]): Game[] {
    let history = [...defeats, ...victorires];
    if (history.length) {
      history = history.sort(
        (game1, game2) =>
          new Date(game2.date).getTime() - new Date(game1.date).getTime()
      );
      history.map((game) => {
        if (game.loser?.id == id) {
          game.opponent = game.winner;
          game.win = false;
        }
        if (game.winner?.id == id) {
          game.opponent = game.loser;
          game.win = true;
        }
      });
    }
    return history;
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(this.endpoint + id).pipe(
      tap((_) => console.log('fetched user')),
      map((user) => {
        user.history = this.getHistory(
          user.id,
          user.defeats || [],
          user.victories || []
        );
        return user;
      }),
      catchError(this.handleError<User>('getUser'))
    );
  }

  /** Request the user informations based on the intra_id.
   * Update the user informations with the new data from input
   * */
  updateUser(newUser: UserUpdateDto, id: number) {
    return this.http
      .patch<User>(this.endpoint + id, newUser)
      .pipe(tap((_) => console.log('User updated')));
  }

  /** Upload the avatar */
  uploadFile(file: any) {
    return this.http.post(`${this.endpoint}upload`, file).pipe(
      tap((_) => console.log('File uploaded')),
      catchError(this.handleError('uploadFile'))
    );
  }

  /** Ask for intra id with access token */
  getIntraFromToken() {
    return this.authService.getIntraFromToken();
  }

  getCurrentUser() {
    return this.http.get<User>(`${this.endpoint}current-user`).pipe(
      tap((_) => console.log('get current user')),
      catchError(this.handleError<User>('getCurrentUser'))
    );
  }

  /** Generate a random avatar */
  getRandomAvatar() {
    return this.http
      .get<string>(`${this.endpoint}random-avatar`, { withCredentials: true })
      .pipe(
        tap((_) => console.log('Random avatar created')),
        catchError(this.handleError<string>('getRandomAvatar'))
      );
  }

  addAction(
    category: ActionCategory,
    recipient_id: number,
    metadata: any = undefined
  ) {
    return this.http
      .post(this.endpoint + 'add-action', { category, recipient_id, metadata })
      .pipe(
        tap((_) => console.log('action added')),
        catchError(this.handleError<User>('addAction'))
      );
  }

  delAction(action: Action) {
    return this.http.post(this.endpoint + 'del-action', { action }).pipe(
      tap((_) => console.log('action deleted')),
      catchError(this.handleError<User>('delAction'))
    );
  }

  updateAction(action: Action) {
    return this.http.patch(this.endpoint + 'update-action', { action }).pipe(
      tap((_) => console.log('action updated')),
      catchError(this.handleError<User>('updateAction'))
    );
  }

  acceptAction(action: Action) {
    return this.http.post(this.endpoint + 'accept-action', { action }).pipe(
      tap((_) => console.log('action accepted')),
      catchError(this.handleError<User>('acceptAction'))
    );
  }

  delFriend(friend_id: number) {
    return this.http.post(this.endpoint + 'del-friend', { friend_id }).pipe(
      tap((_) => console.log('friend deleted')),
      catchError(this.handleError<User>('delFriend'))
    );
  }

  getAchievement() {
    return this.http.get<Achievement[]>(`${this.endpoint}achievement`).pipe(
      tap((_) => console.log('get Achievement')),
      catchError(this.handleError<Achievement[]>('getAchievement'))
    );
  }

  searchUsers(term: string): Observable<User[]> {
    if (!term.trim()) return of([]);
    return this.http
      .get<User[]>(`${this.endpoint}search?nickname=${term}`)
      .pipe(
        tap((x) =>
          x.length
            ? console.log(`found users matching "${term}"`)
            : console.log(`no users matching "${term}"`)
        ),
        map((users) => users.filter((user) => user.id != this.currentUser?.id)),
        catchError(this.handleError<User[]>('searchUsers', []))
      );
  }
}
