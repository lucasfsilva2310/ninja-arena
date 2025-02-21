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

- Após selecionar uma habilidade e selecionar o personagem onde a habilidade fica registrada no personagem, deve ser possível clicar na habilidade novamente para removê-la da lista de ações. Isolar a div "Efeitos" para abaixo da div do personagem, para que seja possível clicar em uma habilidade de forma independente e removê-la da seleção se necessário

- Exibir activeEffects em todos os personagens durante o turno ( atualizar activeEffects para que tenha o nome da habilidade, descrição etc.)

- Cada personagem pode utilizar somente uma habilidade por turno, ao selecionar uma habilidade e selecionar seu target os botôes de habilidade devem ser desabilitados

- Ao abrir o modal de seleção de chakras para substituir chakra random, os chakras devem ser agrupados. Deve se exibir cada tipo de chakra, o seu total acumulado e um botão de + e um de -, indicando quantos chakras daquele tipo o usuário quer utilizar para substituir o Random. E a cada chakra selecionado no mais, os chakras randoms são diminuidos até todos estarem zerados.
  Quando o chakra random estiver zerado nao deve ser mais possível clicar no botão de +, somente no de -. QUando o chakra random estiver zerado o botão de confirmar deve ficar habilitado.
