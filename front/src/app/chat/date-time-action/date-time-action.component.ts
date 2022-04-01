import { NotifType } from '../../models/notif';
import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
} from '@angular/core';

export interface DateTimeEvent {
  buttonAction: HTMLButtonElement;
  idEvent: number;
  dateTime: string;
  type: string;
}

@Component({
  selector: 'app-date-time-action',
  templateUrl: './date-time-action.component.html',
  styleUrls: ['./date-time-action.component.scss'],
})
export class DateTimeActionComponent implements OnInit {
  @Output() dateTimeEvent = new EventEmitter<DateTimeEvent>();
  @Input() idEvent!: number;
  @Input() type!: NotifType;

  @ViewChild('buttonAction') buttonAction!: ElementRef;
  @ViewChild('dateTimeInput') dateTimeInput!: ElementRef;

  currentValue!: string;

  NotifType = NotifType;

  constructor() {}

  ngOnInit(): void {}

  onClickOk() {
    if (new Date(this.currentValue) > new Date())
      this.dateTimeEvent.emit({
        buttonAction: this.buttonAction.nativeElement,
        idEvent: this.idEvent,
        dateTime: this.currentValue,
        type: this.type,
      });
  }

  getMin() {
    let isoDate = new Date().toISOString();
    let minDate = isoDate.substring(0, isoDate.lastIndexOf(':'));
    return minDate;
  }

  validate() {
    let input = this.dateTimeInput.nativeElement as HTMLInputElement;
    let button = this.buttonAction.nativeElement as HTMLButtonElement;
    if (new Date(this.currentValue) <= new Date()) {
      input.classList.add('red');
      button.disabled = true;
    } else {
      input.classList.remove('red');
      button.disabled = false;
    }
  }
}
