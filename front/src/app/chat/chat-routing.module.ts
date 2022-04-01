import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatViewComponent } from './chat-view/chat-view.component';
import { ChannelsListComponent } from './channels-list/channels-list.component';
import { ChatComponent } from './chat.component';
import { CreateChannelComponent } from './create-channel/create-channel.component';
import { UserRoomActionComponent } from './user-room-action/user-room-action.component';
import { ParametersComponent } from './parameters/parameters.component';

const routes: Routes = [
  { path: '', component: ChannelsListComponent },
  { path: 'create', component: CreateChannelComponent },
  { path: 'create/:name', component: CreateChannelComponent },
  { path: 'user-room-action', component: UserRoomActionComponent },
  { path: 'params', component: ParametersComponent },
  { path: ':channel', component: ChatViewComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChatRoutingModule {}
