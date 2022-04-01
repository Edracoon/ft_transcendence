import { NgModule } from '@angular/core';

import { ChatRoutingModule } from './chat-routing.module';
import { ChatComponent } from './chat.component';
import { SharedModule } from '../shared/shared.module';
import { ChatViewComponent } from './chat-view/chat-view.component';
import { ChannelsListComponent } from './channels-list/channels-list.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ChannelComponent } from './channel/channel.component';
import { CreateChannelComponent } from './create-channel/create-channel.component';
import { NavComponent } from './nav/nav.component';
import { InvitationChannelComponent } from './invitation-channel/invitation-channel.component';
import { ChatSocketService } from '../services/chat-socket.service';
import { UserRoomActionComponent } from './user-room-action/user-room-action.component';
import { DateTimeActionComponent } from './date-time-action/date-time-action.component';
import { ParametersComponent } from './parameters/parameters.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DatePipe } from '@angular/common';

@NgModule({
  declarations: [
    ChatComponent,
    ChannelsListComponent,
    ChannelComponent,
    CreateChannelComponent,
    NavComponent,
    InvitationChannelComponent,
    ChatViewComponent,
    UserRoomActionComponent,
    DateTimeActionComponent,
    ParametersComponent,
  ],
  providers: [ChatSocketService, DatePipe],
  imports: [
    SharedModule,
    ChatRoutingModule,
    ReactiveFormsModule,
    FontAwesomeModule,
  ],
})
export class ChatModule {}
