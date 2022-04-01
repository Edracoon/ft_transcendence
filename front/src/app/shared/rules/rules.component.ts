import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss'],
})
export class RulesComponent implements OnInit {
  constructor(private titleService: Title) {
    this.titleService.setTitle('Rules');
  }

  ngOnInit(): void {}
}
