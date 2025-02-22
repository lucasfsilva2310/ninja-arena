# Ninja Arena

## Como executar o projeto

```
npm i

npm run dev
```

Naruto Battle Arena - README

Visão Geral

Este projeto é um jogo baseado no universo de Naruto, onde dois jogadores (usuário e IA) batalham utilizando personagens e habilidades baseadas no anime. Cada jogador pode selecionar três personagens e realizar ações estratégicas utilizando diferentes tipos de chakra.

Tecnologias Utilizadas

React: Interface gráfica do jogo.

TypeScript: Garantia de tipagem segura no código.

CSS: Estilização da interface.

Game Engine: Mecanismo interno que gerencia batalhas e lógica do jogo.

Funcionalidades

1. Seleção de Habilidades

O jogador escolhe as habilidades disponíveis para cada um dos seus personagens, considerando o chakra disponível.

2. Escolha de Alvos

Cada habilidade pode ter diferentes alvos possíveis:

Enemy: Um inimigo específico.

AllEnemies: Todos os inimigos.

Ally: Um aliado.

AllAllies: Todos os aliados.

Self: O próprio personagem.

3. Turnos

O jogador seleciona suas ações e finaliza o turno.

Os efeitos das habilidades são aplicados no final do turno.

O jogo continua até que todos os personagens de um dos jogadores sejam derrotados.

4. Gerenciamento de Chakra

Cada habilidade tem requisitos de chakra específicos. Caso seja necessário um chakra aleatório, o jogador deve selecioná-lo em um modal antes de prosseguir.

5. Inteligência Artificial (IA)

A IA toma decisões com base nos chakras disponíveis e escolhe habilidades aleatórias para atacar ou se defender.

Estrutura do Código

1. Componentes

Battle.tsx: Gerencia a interface e lógica de batalha.

Modal.tsx: Modal para seleção de chakra aleatório.

GameEngine.ts: Regras de batalha e lógica do jogo.

2. Modelos

Character.model.ts: Representa os personagens e seus atributos.

Ability.model.ts: Representa habilidades e seus efeitos.

3. Classes Principais

GameEngine: Gerencia os turnos, aplicação de habilidades e condições de vitória.

Player: Representa um jogador e seus personagens.

Character: Representa cada personagem e suas habilidades.

Ability: Representa as habilidades dos personagens.

## Como Jogar

Escolha habilidades para cada personagem.

Selecione os alvos apropriados.
W

Aguarde a IA executar suas ações.

O jogo continua até que um dos lados vença.

## TODO List

- Adicionar lógica de caso vc comece o turno, vc inicia com somente 1 chakra. Os chakras subsequentes dos proximos turnos que vc vai receber é equivalente a quantidade de personagens vivos do seu time.

- Desenvolver outros tipos de habilidades, como por exemplo clone das sombras que da damageReduction E aumenta a força de rasengan

- Colocar tempo de 60 segundos para executar as ações. Caso o player finalize o turno antes do tempo final, o tempo é resetado para o próximo player. Caso o player não finalize o turno somente as ações dentro de selectedActions serão executadas.

- Adicionar lógica para poder substituir 5 chakras random por um de sua escolha. Criar um novo modal que terá o botão habilitado caso o player tenha 5 ou mais chakras. Ao abrir o modal, será bem semelhante ao modal de substituição de Random, só que agora 5 devem ser selecionados e também deve ter a opção de selecionar o tipo de chakra que os 5 irão se transformar. Ao selecionar os 5 e clicar no botão habilitado, player.chakras deve ser atualizado removendo os chakras utilizados e adicionando o novo, também atualizando os estados do componente Battle.

- Ajustar quando 2 habilidades ou mais são selecionadas no mesmo personagem para o player 1, fica listado somente a primeira habilidade utilizada

- Ajustar para quem começar no primeiro turno receber somente 1 de chakra, independente da quantidade de personagens vivos
