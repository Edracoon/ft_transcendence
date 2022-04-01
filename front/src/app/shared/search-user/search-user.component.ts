import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  Subject,
  switchMap,
} from 'rxjs';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';
import { filter } from 'rxjs';

export interface SearchEvent {
  elmt: HTMLElement;
  event: any;
  user: User;
  searchBox: HTMLInputElement;
}

@Component({
  selector: 'app-search-user',
  templateUrl: './search-user.component.html',
  styleUrls: ['./search-user.component.scss'],
})
export class SearchUserComponent implements OnInit {
  users$!: Observable<User[]>;
  private searchTerms = new Subject<string>();

  @Input() fixed = true;

  @Output() searchEvent = new EventEmitter<SearchEvent>();

  constructor(private userService: UserService) {}

  search(term: string): void {
    this.searchTerms.next(term);
  }

  ngOnInit(): void {
    this.users$ = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => this.userService.searchUsers(term))
    );
  }

  onUnfocus(searchBox: HTMLInputElement) {
    searchBox.value = '';
    this.search('');
  }

  onClick(
    elmt: HTMLElement,
    event: any,
    user: User,
    searchBox: HTMLInputElement
  ) {
    this.onUnfocus(searchBox);
    this.searchEvent.emit({ elmt, event, user, searchBox });
  }
}
