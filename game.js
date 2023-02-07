var game = new Phaser.Game(1000, 480, Phaser.CANVAS, "game");

var PhaserGame = function(game) {
	this.tank = null;
	this.turret = null;
	this.flame = null;
	this.bullet = null;

	this.background = null;
	this.targets = null;
	this.land = null;
	this.emitter = null;

	this.power = 300;
	this.powerText = null;

	this.cursors = null;
	this.fireButton = null;
};

PhaserGame.prototype = {
	init: function() {
		this.game.renderer.renderSession.roundPixels = true;

		this.game.world.setBounds(0, 0, 992, 480);

		this.physics.startSystem(Phaser.Physics.ARCADE);
		this.physics.arcade.gravity.y = 200;
	},

	preload: function() {
		this.load.image("tank", "assets/tank.png");
		this.load.image("turret", "assets/turret.png");
		this.load.image("bullet", "assets/bullet.png");
		this.load.image("background", "assets/background.jpg");
		this.load.image("flame", "assets/flame.png");
		this.load.image("target", "assets/target.png");
		this.load.image("land", "assets/land.png");
	},

	create: function() {
		this.background = this.add.sprite(0, 0, "background");

		this.targets = this.add.group(
			this.game.world,
			"targets",
			false,
			true,
			Phaser.Physics.ARCADE
		);

		this.targets.create(284, 378, "target");
		this.targets.create(456, 153, "target");
		this.targets.create(545, 305, "target");
		this.targets.create(726, 391, "target");
		this.targets.create(972, 74, "target");

		this.targets.setAll("body.allowGravity", false);

		this.land = this.add.bitmapData(992, 480);
		this.land.draw("land");
		this.land.update();
		this.land.addToWorld();

		this.emitter = this.add.emitter(0, 0, 30);
		this.emitter.makeParticles("flame");
		this.emitter.setXSpeed(-120, 120);
		this.emitter.setYSpeed(-100, -200);
		this.emitter.setRotation();

		this.bullet = this.add.sprite(0, 0, "bullet");
		this.bullet.exists = false;
		this.physics.arcade.enable(this.bullet);

		this.tank = this.add.sprite(24, 383, "tank");
		this.tank.scale.set(0.2);

		this.turret = this.add.sprite(this.tank.x + 20, this.tank.y + 10, "turret");
		this.turret.scale.set(0.2);

		this.flame = this.add.sprite(0, 0, "flame");
		this.flame.anchor.set(0.5);
		this.flame.visible = false;

		this.power = 300;
		this.powerText = this.add.text(8, 8, "Power: 300", {
			font: "18px Arial",
			fill: "#ffffff",
		});
		this.powerText.setShadow(1, 1, "rgba(0, 0, 0, 0.8)", 1);
		this.powerText.fixedToCamera = true;

		this.cursors = this.input.keyboard.createCursorKeys();

		this.fireButton = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		this.fireButton.onDown.add(this.fire, this);
	},

	bulletVsLand: function() {
		if (
			this.bullet.x < 0 ||
			this.bullet.x > this.game.world.width ||
			this.bullet.y > this.game.height
		) {
			this.removeBullet();
			return;
		}

		var x = Math.floor(this.bullet.x);
		var y = Math.floor(this.bullet.y);
		var rgba = this.land.getPixel(x, y);

		if (rgba.a > 0) {
			this.land.blendDestinationOut();
			this.land.circle(x, y, 16, "rgba(0, 0, 0, 255");
			this.land.blendReset();
			this.land.update();
			this.removeBullet();
		}
	},

	fire: function() {
		if (this.bullet.exists) {
			return;
		}

		this.bullet.reset(this.turret.x, this.turret.y);

		var p = new Phaser.Point(this.turret.x, this.turret.y);
		p.rotate(p.x, p.y, this.turret.rotation, false, 34);

		this.flame.x = p.x;
		this.flame.y = p.y;
		this.flame.alpha = 1;
		this.flame.visible = true;

		this.add.tween(this.flame).to({ alpha: 0 }, 100, "Linear", true);
		this.camera.follow(this.bullet);

		this.physics.arcade.velocityFromRotation(
			this.turret.rotation,
			this.power,
			this.bullet.body.velocity
		);
	},

	hitTarget: function(bullet, target) {
		this.emitter.at(target);
		this.emitter.explode(2000, 10);

		target.kill();

		this.removeBullet(true);
	},

	removeBullet: function(hasExploded) {
		if (typeof hasExploded === "undefined") {
			hasExploded = false;
		}

		this.bullet.kill();
		this.camera.follow();

		var delay = 1000;

		if (hasExploded) {
			delay = 2000;
		}

		this.add.tween(this.camera).to({ x: 0 }, 1000, "Quint", true, delay);
	},

	update: function() {
		if (this.bullet.exists) {
			this.physics.arcade.overlap(
				this.bullet,
				this.targets,
				this.hitTarget,
				null,
				this
			);

			this.bulletVsLand();
		} else {
			if (this.cursors.left.isDown && this.power > 100) {
				this.power -= 2;
			} else if (this.cursors.right.isDown && this.power < 600) {
				this.power += 2;
			}

			if (this.cursors.up.isDown && this.turret.angle > -90) {
				this.turret.angle--;
			} else if (this.cursors.down.isDown && this.turret.angle < 0) {
				this.turret.angle++;
			}

			this.powerText.text = "Power: " + this.power;
		}
	},
};

game.state.add("Game", PhaserGame, true);
