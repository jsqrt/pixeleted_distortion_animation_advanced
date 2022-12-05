/* eslint-disable no-unreachable */
import * as T from 'three';
import dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import can from '../../images/can.png';
import sn1 from '../../images/sn1.png';
import sn2 from '../../images/sn2.png';

export default class Sketch {
	constructor(options) {
		this.scene = new T.Scene();

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
		this.camera.position.set(0, 0, 1000);
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.time = 0;

		this.isPlaying = true;

		this.loadObjects().then(() => {
			this.addObjects();
			this.resize();
			this.render();
			this.setupResize();
		});
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

		const sn1prom = new Promise((resolve, reject) => {
			loader.load(
				sn1,
				(data) => {
					this.sn1 = data;
					resolve();
				},
				() => {},
				(err) => {
					console.log(err);
					reject();
				},
			);
		});

		const sn2prom = new Promise((resolve, reject) => {
			loader.load(
				sn2,
				(data) => {
					this.sn2 = data;
					resolve();
				},
				() => {},
				(err) => {
					console.log(err);
					reject();
				},
			);
		});

		const canProm = new Promise((resolve, reject) => {
			loader.load(
				can,
				(data) => {
					this.can = data;
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
			sn1prom,
			sn2prom,
			canProm,
		]);
	}

	// addObjects() {
	// 	let that = this;
	// 	this.material = new T.MeshNormalMaterial({
	// 		side: T.DoubleSide,
	// 	});

	// 	// this.material = new T.ShaderMaterial({
	// 	// 	extensions: {
	// 	// 		derivatives: '#extension GL_OES_standard_derivatives : enable',
	// 	// 	},
	// 	// 	side: T.DoubleSide,
	// 	// 	uniforms: {
	// 	// 		time: { type: 'f', value: 0 },
	// 	// 	},
	// 	// 	// wireframe: true,
	// 	// 	// transparent: true,
	// 	// 	vertexShader: this.vertex,
	// 	// 	fragmentShader: this.fragment,
	// 	// });

	// 	this.geometry = new T.PlaneGeometry(1, 1, 1);

	// 	this.mesh = new T.Mesh(this.geometry, this.material);
	// 	this.scene.add(this.mesh);
	// }

	addObjects() {
		const particalsCount = 512;
		const array = new Float32Array((particalsCount ** 2) * 3);
		this.geometry = new T.BufferGeometry();
		this.positions = new T.BufferAttribute(array, 3); // partical count * 3 coordinates

		this.material = new T.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable',
			},
			side: T.DoubleSide,
			uniforms: {
				progress: {
					type: 'f',
					value: 0,
				},
			},
			vertexShader: this.vertex,
			fragmentShader: this.fragment,
		});

		let currentIndex = 0;
		let z = 0;

		for (let x = 0; x < particalsCount; x += 1) {
			for (let y = 0; y < particalsCount; y += 1) {
				this.centX = (x - particalsCount / 2) * 2;
				this.centY = (y - particalsCount / 2) * 2;

				this.positions.setXYZ(currentIndex, this.centX, this.centY, z);
				currentIndex += 1;
			}
		}
		// for (let x = 0; x < particalsCount; x += 1) {
		// 	let xPos = x - 256;
		// 	for (let y = 0; y < particalsCount; y += 1) {
		// 		this.centX = (x - particalsCount / 2) * 2;
		// 		this.centY = (y - particalsCount / 2) * 2;

		// 		this.positions.setXYZ(currentIndex, xPos, this.centY, z);
		// 		currentIndex += 1;
		// 	}
		// }

		console.log(this.positions); //!

		this.geometry.setAttribute('position', this.positions);

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
		this.time += 0.05;
		// this.material.uniforms.time.value = this.time;
		// this.mesh.rotation.x += 0.01;
		// this.mesh.rotation.y += 0.02;
		window.requestAnimationFrame(this.render.bind(this));
		this.renderer.render(this.scene, this.camera);
	}
}
