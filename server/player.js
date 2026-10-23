import { createBehavioralFsm } from 'machina';
import { hasFourOfAKind } from './cards.js';

export function createPlayer({ id, game }) {
  return {
    id,
    game,
    socket: null,
    name: '',
    avatar: null,
    ready: false,
    seated: false,
    hand: [],
    incoming: [],
    drawnId: null,
    hasSpoon: false,
    letters: 0,
  };
}

// One behavior shared by every player in every game; each player object is a
// machina "client". The game listens for the custom events emitted here.
export const playerFsm = createBehavioralFsm({
  id: 'player',
  initialState: 'lobby',

  states: {
    lobby: {
      _onEnter({ ctx }) {
        ctx.ready = false;
        ctx.seated = false;
        ctx.hand = [];
        ctx.incoming = [];
        ctx.drawnId = null;
        ctx.hasSpoon = false;
      },

      'set-name'({ ctx }, { name }) {
        ctx.name = String(name || '').trim().slice(0, 20);
      },

      ready({ ctx }, { ready }) {
        ctx.ready = Boolean(ready) && Boolean(ctx.avatar) && Boolean(ctx.name);
      },
    },

    play: {
      _onEnter({ ctx }) {
        ctx.seated = true;
        ctx.drawnId = null;
      },

      draw({ ctx }) {
        // A fifth card means they're still holding the last one they drew
        if (ctx.hand.length >= 5 || ctx.incoming.length === 0) {
          return;
        }
        const card = ctx.incoming.shift();
        ctx.hand.push(card);
        ctx.drawnId = card.id;
      },

      pass({ ctx, emit }, { cardId }) {
        if (ctx.hand.length < 5) {
          return;
        }
        const index = ctx.hand.findIndex((card) => card.id === cardId);
        if (index === -1) {
          return;
        }
        const [card] = ctx.hand.splice(index, 1);
        ctx.drawnId = null;
        emit('passed', { player: ctx, card });
      },

      'grab-spoon'({ ctx, emit }) {
        if (!ctx.game.raceOn && !hasFourOfAKind(ctx.hand)) {
          emit('denied', { player: ctx });
          return;
        }
        emit('grabbed', { player: ctx });
        return 'racing';
      },
    },

    // Tapping the dot puzzle on their phone stands in for lunging at the table
    racing: {
      'puzzle-done'({ ctx, emit }) {
        ctx.hasSpoon = true;
        emit('got-spoon', { player: ctx });
        return 'safe';
      },
    },

    safe: {},
  },
});
