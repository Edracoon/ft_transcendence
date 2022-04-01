import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UserSocketService } from '../../services/user-socket.service';
import { UserService } from '../../services/user.service';
import { UserStatus } from 'src/app/models/user';
import { Subscription } from 'rxjs';
import { Scavenger } from '@wishtack/rx-scavenger';

@Component({
  selector: 'app-user-status',
  templateUrl: './user-status.component.html',
  styleUrls: ['./user-status.component.scss'],
})
export class UserStatusComponent implements OnInit, OnDestroy {
  @Input() userId?: number;
  status?: UserStatus;

  private _scavenger: Scavenger = new Scavenger(this);

  constructor(private userSocketService: UserSocketService) {}

  ngOnInit(): void {
    this.userSocketService.emit('get_status', this.userId);
    this.userSocketService
      .listen('status_' + this.userId)
      .pipe(this._scavenger.collect())
      .subscribe((status: any) => {
        this.status = status;
      });
  }

  ngOnDestroy(): void {
    this._scavenger.unsubscribe();
  }
}
