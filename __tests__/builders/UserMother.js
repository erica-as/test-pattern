import { User } from '../../src/domain/User.js';


export class UserMother {
  /**
   * Cria um usuário padrão (sem benefícios especiais).
   * @returns {User}
   */
  static umUsuarioPadrao() {
    return new User(1, 'João Silva', 'joao@email.com', 'PADRAO');
  }

  /**
   * Cria um usuário premium (com direito a 10% de desconto).
   * @returns {User}
   */
  static umUsuarioPremium() {
    return new User(2, 'Maria Premium', 'premium@email.com', 'PREMIUM');
  }
}
