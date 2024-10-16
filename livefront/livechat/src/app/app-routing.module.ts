import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';  // Importe o seu componente aqui

const routes: Routes = [
  { path: '', redirectTo: '/chat', pathMatch: 'full' },  // Redireciona a rota raiz para o componente de chat
  { path: 'chat', component: ChatComponent },  // Rota para o componente de chat
  { path: '**', redirectTo: '/chat' }  // Redireciona qualquer rota desconhecida para o chat
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
