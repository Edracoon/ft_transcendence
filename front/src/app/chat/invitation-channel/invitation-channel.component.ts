import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { User } from 'src/app/models/user';
import { SearchEvent } from '../../shared/search-user/search-user.component';
import { UserService } from '../../services/user.service';
import { Scavenger } from '@wishtack/rx-scavenger';

@Component({
  selector: 'app-invitation-channel',
  templateUrl: './invitation-channel.component.html',
  styleUrls: ['./invitation-channel.component.scss'],
})
export class InvitationChannelComponent implements OnInit, OnDestroy {
  @Input() selectedUsers: User[] = [];
  @Input() fixed = true;
  constructor(private userService: UserService) {}
  currentId!: number;
  private _scavenger: Scavenger = new Scavenger(this);

  searchBox?: HTMLInputElement;
  @Output() searchEvent = new EventEmitter<SearchEvent>();

  ngOnInit(): void {
    this.userService
      .getIntraFromToken()
      .pipe(this._scavenger.collect())
      .subscribe((id) => {
        this.currentId = id;
      });
  }

  onSearchEvent(searchEvent: SearchEvent) {
    this.searchBox = searchEvent.searchBox;
    if (
      !this.selectedUsers.find((user) => user.id == searchEvent.user.id) &&
      searchEvent.user.id != this.currentId
    ) {
      this.searchEvent.emit(searchEvent);
    }
  }

  onDelete(user: User) {
    this.selectedUsers.splice(
      this.selectedUsers.findIndex((user_) => user_.id == user.id),
      1
    );
    this.searchBox!.disabled = false;
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }
}
