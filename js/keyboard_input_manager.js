function KeyboardInputManager() {
  this.events = {};

  if (window.navigator.msPointerEnabled) {
    //Internet Explorer 10 style
    this.eventTouchstart    = "MSPointerDown";
    this.eventTouchmove     = "MSPointerMove";
    this.eventTouchend      = "MSPointerUp";
  } else {
    this.eventTouchstart    = "touchstart";
    this.eventTouchmove     = "touchmove";
    this.eventTouchend      = "touchend";
  }

  this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

KeyboardInputManager.prototype.listen = function () {
  var self = this;

  var map = {
    38: 0, // Up
    39: 1, // Right
    40: 2, // Down
    37: 3, // Left
    75: 0, // Vim up
    76: 1, // Vim right
    74: 2, // Vim down
    72: 3, // Vim left
    87: 0, // W
    68: 1, // D
    83: 2, // S
    65: 3  // A
  };

  // Respond to direction keys
  document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                    event.shiftKey;
    var mapped    = map[event.which];

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault();
        self.emit("move", mapped);
      }
    }

    // R key restarts the game
    if (!modifiers && event.which === 82) {
      self.restart.call(self, event);
    }
  });

  // Secret code typing functionality removed - now using hack button instead

  // Respond to button presses
  this.bindButtonPress(".hack-button", this.showHackMenu);
  this.bindButtonPress(".hack-close-button", this.hideHackMenu);
  this.bindButtonPress(".hack-fill-button", this.hackFillBoard);
  this.bindButtonPress(".retry-button", this.restart);
  this.bindButtonPress(".restart-button", this.restart);
  this.bindButtonPress(".keep-playing-button", this.keepPlaying);

  // Bind hack tile clicks
  this.bindHackTileClicks();

  // Close hack menu when clicking outside
  this.bindHackMenuOverlayClick();

  // Respond to swipe events
  var touchStartClientX, touchStartClientY;
  var gameContainer = document.getElementsByClassName("game-container")[0];

  gameContainer.addEventListener(this.eventTouchstart, function (event) {
    if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
        event.targetTouches > 1) {
      return; // Ignore if touching with more than 1 finger
    }

    if (window.navigator.msPointerEnabled) {
      touchStartClientX = event.pageX;
      touchStartClientY = event.pageY;
    } else {
      touchStartClientX = event.touches[0].clientX;
      touchStartClientY = event.touches[0].clientY;
    }

    event.preventDefault();
  });

  gameContainer.addEventListener(this.eventTouchmove, function (event) {
    event.preventDefault();
  });

  gameContainer.addEventListener(this.eventTouchend, function (event) {
    if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
        event.targetTouches > 0) {
      return; // Ignore if still touching with one or more fingers
    }

    var touchEndClientX, touchEndClientY;

    if (window.navigator.msPointerEnabled) {
      touchEndClientX = event.pageX;
      touchEndClientY = event.pageY;
    } else {
      touchEndClientX = event.changedTouches[0].clientX;
      touchEndClientY = event.changedTouches[0].clientY;
    }

    var dx = touchEndClientX - touchStartClientX;
    var absDx = Math.abs(dx);

    var dy = touchEndClientY - touchStartClientY;
    var absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 10) {
      // (right : left) : (down : up)
      self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    }
  });
};

KeyboardInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};

KeyboardInputManager.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

KeyboardInputManager.prototype.crowd = function (event) {
  event.preventDefault();
  this.emit("crowd");
};

KeyboardInputManager.prototype.showHackMenu = function (event) {
  event.preventDefault();
  var hackMenu = document.querySelector(".hack-menu");
  hackMenu.classList.add("active");
};

KeyboardInputManager.prototype.hideHackMenu = function (event) {
  event.preventDefault();
  var hackMenu = document.querySelector(".hack-menu");
  hackMenu.classList.remove("active");
};

KeyboardInputManager.prototype.hackFillBoard = function (event) {
  event.preventDefault();
  this.hideHackMenu(event);
  this.emit("crowd");
};

KeyboardInputManager.prototype.hackAddTile = function (value) {
  var hackMenu = document.querySelector(".hack-menu");
  hackMenu.classList.remove("active");
  this.emit("hackAddTile", value);
};

KeyboardInputManager.prototype.bindHackTileClicks = function () {
  var self = this;
  var tiles = document.querySelectorAll(".hack-tile");
  tiles.forEach(function(tile) {
    tile.addEventListener("click", function() {
      var value = parseInt(this.getAttribute("data-value"));
      self.hackAddTile(value);
    });
  });
};

KeyboardInputManager.prototype.bindHackMenuOverlayClick = function () {
  var self = this;
  var hackMenu = document.querySelector(".hack-menu");
  hackMenu.addEventListener("click", function(event) {
    // Close menu if clicking on the overlay (not the content)
    if (event.target === hackMenu) {
      self.hideHackMenu(event);
    }
  });
};

KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
  var button = document.querySelector(selector);
  button.addEventListener("click", fn.bind(this));
  button.addEventListener(this.eventTouchend, fn.bind(this));
  button.addEventListener("keypress", function(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fn.call(this, event);
    }
  }.bind(this));
};
