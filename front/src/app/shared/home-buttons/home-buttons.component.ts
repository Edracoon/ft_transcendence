import { Component, OnInit } from '@angular/core';
import {
  faCrown,
  faRobot,
  faTableTennisPaddleBall,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home-buttons',
  templateUrl: './home-buttons.component.html',
  styleUrls: ['./home-buttons.component.scss'],
})
export class HomeButtonsComponent implements OnInit {
  constructor() {}

  playIcon = faCrown;
  playSoloIcon = faRobot;
  playDualIcon = faTableTennisPaddleBall;
  ngOnInit(): void {}
}
