/* eslint-disable quotes */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-unreachable */
import * as T from 'three';
import dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import gsap from 'gsap';
import CustomEase from 'gsap/CustomEase';

import t1 from '../../images/sn1.png';
import t2 from '../../images/sn2.png';
import t3 from '../../images/can.png';
import mask from '../../images/mask.jpg';

export default class Sketch {
	constructor(options) {
		gsap.registerPlugin(CustomEase);
		this.scene = new T.Scene();

		this.raycaster = new T.Raycaster();
		this.mouse = new T.Vector2();
		this.point = new T.Vector2();

		this.container = options.dom;
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		this.renderer = new T.WebGLRenderer();
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.width, this.height);
		this.renderer.setClearColor(0x000000, 1);
		this.renderer.outputEncoding = T.sRGBEncoding;

		this.container.appendChild(this.renderer.domElement);

		this.camera = new T.PerspectiveCamera(
			50,
			window.innerWidth / window.innerHeight,
			0.1,
			3000,
		);

		// var frustumSize = 10;
		// var aspect = window.innerWidth / window.innerHeight;
		// this.camera = new T.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
		this.camera.position.set(0, 0, 1400);
		// this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.time = 0;
		this.move = 0;
		this.distortionProgress = 0;
		this.displacement = 0;
		this.snapIndex = 0;
		this.currentSlideRealIndex = 0;

		this.isPlaying = true;

		this.loadObjects().then(() => {
			this.addObjects();
			this.resize();
			this.mouseEffects();
			this.settings();
			this.render();
			this.setupResize();
		});
	}

	onMouseMove(e) {
		this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
		this.raycaster.setFromCamera(this.mouse, this.camera);

		this.intersects = this.raycaster.intersectObject(this.test);
		this.point.x = this.intersects[0]?.point.x || this.point.x;
		this.point.y = this.intersects[0]?.point.y || this.point.y;
	}

	updateSliderPos(direction) {
		this.prevSlideIndex = this.currentSlideRealIndex;
		this.snapIndex += direction ? 1 : -1;
		this.snapIndex = this.snapIndex < 0 ? (this.snapIndex + this.textures.length) : this.snapIndex;
		this.currentSlideRealIndex = Math.abs(this.snapIndex % this.textures.length);
	}

	mouseEffects() {
		this.test = new T.Mesh(new T.PlaneGeometry(2000, 2000), new T.MeshBasicMaterial());

		let animTimeout = setTimeout(0);

		gsap.to(this.material.uniforms.transition, {
			duration: 0.7,
			ease: 'Power2.out',
			value: 1,
			onComplete: () => { this.distortionProgress = 1; },
		});

		window.addEventListener('mousedown', (e) => {
			gsap.to(this.material.uniforms.mousePressed, {
				duration: 1,
				value: 1,
				ease: 'elastic.out(1, 0.3)',
			});
		});

		window.addEventListener('mouseup', (e) => {
			gsap.to(this.material.uniforms.mousePressed, {
				duration: 1,
				value: 0,
				ease: 'elastic.out(1, 0.3)',
			});
		});

		window.addEventListener('mousewheel', (e) => {
			this.direction = e.wheelDeltaY > 0;
			this.updateSliderPos(this.direction);
			// this.mainTexture = this.textures[this.prevSlideIndex];

			this.move += e.wheelDeltaY / 20;
			clearTimeout(animTimeout);

			if (this.distortionProgress === 1) {
				this.distortionProgress = 0;
				gsap.to(this.material.uniforms.transition, {
					duration: 2,
					ease: CustomEase.create("custom", "M0,0 C0.034,0.532 0.192,0.901 0.366,0.95 0.502,0.988 0.428,0.984 1,1 "),
					value: 0,
				});
			} else {
				// gsap.to(this.material.uniforms.tt1alpha, {
				// 	duration: 0.6,
				// 	value: 0,
				// });

				// gsap.to(this.material.uniforms.tt2alpha, {
				// 	duration: 0.6,
				// 	value: 0,
				// 	onComplete: () => {
				// 	}
				// });

				gsap.to(this.material.uniforms.move, {
					duration: 2,
					ease: CustomEase.create("custom", "M0,0 C0.034,0.532 0.192,0.901 0.366,0.95 0.502,0.988 0.428,0.984 1,1 "),
					value: this.move,
				});
			}

			this.dispTexture = this.textures[this.currentSlideRealIndex];
			this.material.uniforms.displacement.value = 0;

			// gsap.fromTo(this.material.uniforms.tt2alpha, {
			// 	value: 0,
			// }, {
			// 	duration: 0.6,
			// 	value: 1,
			// 	onComplete: () => {
			// 	},
			// });

			// t1 -> t2 = t2 -> t1

			// gsap.to(this.material.uniforms.tt2alpha, {
			// 	duration: 2,
			// 	ease: 'Power1.in',
			// 	delay: 4,
			// 	value: 1,
			// });

			gsap.to(this.material.uniforms.displacement, {
				duration: 0.6,
				value: 0.5,
			});

			animTimeout = setTimeout(() => {
				gsap.to(this.material.uniforms.transition, {
					duration: 0.7,
					ease: 'Power2.out',
					value: 1,
					onComplete: () => { this.distortionProgress = 1; },
				});
				gsap.to(this.material.uniforms.displacement, {
					duration: 0.6,
					value: 1,
				});
			}, 2000);
		});
		window.addEventListener('mousemove', this.onMouseMove.bind(this));
	}

	settings() {
		let that = this;
		this.settings = {
			progress: 0,
		};
		this.gui = new dat.GUI();
		this.gui.add(this.settings, 'progress', 0, 1, 0.01);
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this));
	}

	resize() {
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		this.renderer.setSize(this.width, this.height);
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
	}

	loadObjects() {
		const loader = new T.FileLoader();
		const textureLoader = new T.TextureLoader();

		const fragment = new Promise((resolve, reject) => {
			loader.load(
				'./shader/fragment.glsl',
				(data) => {
					this.fragment = data;
					resolve();
				},
				() => {},
				(err) => {
					console.log(err);
					reject();
				},
			);
		});

		const vertex = new Promise((resolve, reject) => {
			loader.load(
				'./shader/vertex.glsl',
				(data) => {
					this.vertex = data;
					resolve();
				},
				() => {},
				(err) => {
					console.log(err);
					reject();
				},
			);
		});

		const t1prom = new Promise((resolve, reject) => {
			textureLoader.load(
				t1,
				(data) => {
					this.t1 = data;
					resolve();
				},
				() => {},
				(err) => {
					console.log(err);
					reject();
				},
			);
		});

		const t2prom = new Promise((resolve, reject) => {
			textureLoader.load(
				t2,
				(data) => {
					this.t2 = data;
					resolve();
				},
				() => {},
				(err) => {
					console.log(err);
					reject();
				},
			);
		});

		const t3prom = new Promise((resolve, reject) => {
			textureLoader.load(
				t3,
				(data) => {
					this.t3 = data;
					resolve();
				},
				() => {},
				(err) => {
					console.log(err);
					reject();
				},
			);
		});

		const maskprom = new Promise((resolve, reject) => {
			textureLoader.load(
				mask,
				(data) => {
					this.mask = data;
					resolve();
				},
				() => {},
				(err) => {
					console.log(err);
					reject();
				},
			);
		});

		return Promise.all([
			fragment,
			vertex,
			t1prom,
			t2prom,
			t3prom,
			maskprom,
		]);
	}

	addObjects() {
		const particalsCount = 512;
		const array = () => new Float32Array((particalsCount ** 2) * 3);
		this.geometry = new T.BufferGeometry();
		this.positions = new T.BufferAttribute(array(), 3); // partical count * 3 coordinates
		this.coordinates = new T.BufferAttribute(array(), 3); // partical count * 3 coordinates
		this.speeds = new T.BufferAttribute(new Float32Array((particalsCount ** 2)), 1);
		this.offset = new T.BufferAttribute(new Float32Array((particalsCount ** 2)), 1);
		this.direction = new T.BufferAttribute(new Float32Array((particalsCount ** 2)), 1);
		this.press = new T.BufferAttribute(new Float32Array((particalsCount ** 2)), 1);
		this.textures = [this.t1, this.t2, this.t3];

		this.material = new T.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable',
			},
			side: T.DoubleSide,
			uniforms: {
				t1: {
					type: 't',
					value: this.t1,
				},
				t2: {
					type: 't',
					value: this.t1,
				},
				mask: {
					type: 't',
					value: this.mask,
				},
				progress: {
					type: 'f',
					value: 0,
				},
				mouse: {
					type: 'v2',
					value: null,
				},
				transition: {
					type: 'f',
					value: null,
				},
				mousePressed: {
					type: 'f',
					value: 0,
				},
				move: {
					type: 'f',
					value: 0,
				},
				time: {
					type: 'f',
					value: 0,
				},
				displacement: {
					type: 'f',
					value: 0,
				},
				tt1alpha: {
					type: 'f',
					value: 1,
				},
				tt2alpha: {
					type: 'f',
					value: 1,
				},
			},
			transparent: true,
			depthTest: false,
			depthWrite: false,
			vertexShader: this.vertex,
			fragmentShader: this.fragment,
		});

		let currentIndex = 0;
		let z = 0;
		const rand = (a, b) => a + (b - a) * Math.random();

		for (let x = 0; x < particalsCount; x += 1) {
			this.centX = (x - particalsCount / 2) * 2;
			for (let y = 0; y < particalsCount; y += 1) {
				this.centY = (y - particalsCount / 2) * 2;

				this.positions.setXYZ(currentIndex, this.centX, this.centY, z);
				this.coordinates.setXYZ(currentIndex, x, y, z);
				this.offset.setX(currentIndex, rand(-1000, 1000));
				this.speeds.setX(currentIndex, rand(0.4, 1));
				this.direction.setX(currentIndex, Math.random() > 0.5 ? 1 : -1);
				this.press.setX(currentIndex, rand(0.4, 1));
				currentIndex += 1;
			}
		}

		this.geometry.setAttribute('position', this.positions);
		this.geometry.setAttribute('aCoordinates', this.coordinates);
		this.geometry.setAttribute('aOffset', this.offset);
		this.geometry.setAttribute('aSpeed', this.speeds);
		this.geometry.setAttribute('aPress', this.press);
		this.geometry.setAttribute('aDirection', this.direction);

		this.mainTexture = this.t1;
		this.dispTexture = this.t1;

		this.mesh = new T.Points(this.geometry, this.material);
		this.scene.add(this.mesh);
	}

	stop() {
		this.isPlaying = false;
	}

	play() {
		if (!this.isPlaying) {
			this.render();
			this.isPlaying = true;
		}
	}

	render() {
		if (!this.isPlaying) return;
		this.time += 1;
		this.material.uniforms.t1.value = this.mainTexture;
		this.material.uniforms.t2.value = this.dispTexture;

		// this.material.uniforms.transition.value = this.settings.progress;

		this.material.uniforms.time.value = this.time;

		// console.log(this.displacement); //!

		// this.material.uniforms.displacement.value = this.displacement;
		// this.material.uniforms.move.value = this.move;
		this.material.uniforms.mouse.value = this.point;
		window.requestAnimationFrame(this.render.bind(this));
		this.renderer.render(this.scene, this.camera);
	}
}
