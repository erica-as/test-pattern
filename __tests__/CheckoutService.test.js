import { CheckoutService } from '../src/services/CheckoutService.js';
import { Item } from '../src/domain/Item.js';
import { Pedido } from '../src/domain/Pedido.js';
import { UserMother } from './builders/UserMother.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';


const criarDummy = () => ({
  cobrar: jest.fn(),
  salvar: jest.fn(),
  enviarEmail: jest.fn(),
});


describe('CheckoutService', () => {


  describe('quando o pagamento falha', () => {

    it('deve retornar null e não salvar o pedido nem enviar e-mail', async () => {
      const carrinho = new CarrinhoBuilder().build();

      const gatewayStub = {
        cobrar: jest.fn().mockResolvedValue({ success: false }),
      };

      const repositoryDummy = { salvar: jest.fn() };
      const emailDummy = { enviarEmail: jest.fn() };

      const checkoutService = new CheckoutService(
        gatewayStub,
        repositoryDummy,
        emailDummy,
      );

      const pedido = await checkoutService.processarPedido(carrinho, '4111-1111-1111-1111');

      expect(pedido).toBeNull();

      expect(repositoryDummy.salvar).not.toHaveBeenCalled();
      expect(emailDummy.enviarEmail).not.toHaveBeenCalled();
    });
  });

  describe('quando um cliente Premium finaliza a compra', () => {

    it('deve cobrar com 10% de desconto e enviar e-mail de confirmação', async () => {
      const usuarioPremium = UserMother.umUsuarioPremium();

      const carrinho = new CarrinhoBuilder()
        .comUser(usuarioPremium)
        .comItens([new Item('Notebook', 200)])
        .build();

    
      const gatewayStub = {
        cobrar: jest.fn().mockResolvedValue({ success: true }),
      };

      const pedidoSalvoEsperado = new Pedido(99, carrinho, 180, 'PROCESSADO');
      const repositoryStub = {
        salvar: jest.fn().mockResolvedValue(pedidoSalvoEsperado),
      };

     
      const emailMock = {
        enviarEmail: jest.fn().mockResolvedValue(undefined),
      };

      const checkoutService = new CheckoutService(
        gatewayStub,
        repositoryStub,
        emailMock,
      );

      const pedidoRetornado = await checkoutService.processarPedido(
        carrinho,
        '4111-1111-1111-1111',
      );


      expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, '4111-1111-1111-1111');

      expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
      expect(emailMock.enviarEmail).toHaveBeenCalledWith(
        'premium@email.com',
        'Seu Pedido foi Aprovado!',
        expect.stringContaining('99'), 
      );

      expect(pedidoRetornado).toEqual(pedidoSalvoEsperado);
    });
  });


  describe('quando um cliente Padrão finaliza a compra', () => {

    it('deve cobrar o valor integral sem aplicar desconto', async () => {
      const carrinho = new CarrinhoBuilder()
        .comUser(UserMother.umUsuarioPadrao())
        .comItens([new Item('Teclado', 150)])
        .build();

      const gatewayStub = {
        cobrar: jest.fn().mockResolvedValue({ success: true }),
      };

      const pedidoSalvo = new Pedido(10, carrinho, 150, 'PROCESSADO');
      const repositoryStub = {
        salvar: jest.fn().mockResolvedValue(pedidoSalvo),
      };

      const emailDummy = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

      const checkoutService = new CheckoutService(
        gatewayStub,
        repositoryStub,
        emailDummy,
      );

      const pedidoRetornado = await checkoutService.processarPedido(
        carrinho,
        '4111-1111-1111-1111',
      );

      expect(gatewayStub.cobrar).toHaveBeenCalledWith(150, '4111-1111-1111-1111');
      expect(pedidoRetornado).toEqual(pedidoSalvo);
    });
  });

  describe('quando o carrinho está vazio', () => {

    it('deve cobrar R$ 0,00 e processar normalmente', async () => {
      const carrinho = new CarrinhoBuilder().vazio().build();

      const gatewayStub = {
        cobrar: jest.fn().mockResolvedValue({ success: true }),
      };

      const pedidoVazio = new Pedido(5, carrinho, 0, 'PROCESSADO');
      const repositoryStub = {
        salvar: jest.fn().mockResolvedValue(pedidoVazio),
      };

      const emailDummy = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

      const checkoutService = new CheckoutService(
        gatewayStub,
        repositoryStub,
        emailDummy,
      );

      const pedidoRetornado = await checkoutService.processarPedido(
        carrinho,
        '4111-1111-1111-1111',
      );

      expect(gatewayStub.cobrar).toHaveBeenCalledWith(0, '4111-1111-1111-1111');
      expect(pedidoRetornado).toEqual(pedidoVazio);
    });
  });

});
