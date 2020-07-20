
var activeOption = 'legs';


const TRAY = document.getElementById('js-tray-slide');

const colors = [
{
	texture: 'img/wood.jpg',
	size: [2,2,2],
	shininess: 60
},
{
	texture: 'img/denim.jpg',
	size: [3, 3, 3],
	shininess: 0
},
{
	color: '66533C'
},
{
	color: '173A2F'
},
{
	color: '153944'
},
{
	color: '27548D'
},
{
	color: '438AAC'
}  
]


// Camera position that will be used on z
var cameraFar = 5;
var theModel;

const MODEL_PATH =  "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1376484/chair.glb";

const BACKGROUND_COLOR = 0xf1f1f1;

// Init the scene
const scene = new THREE.Scene();

// Set background
scene.background = new THREE.Color(BACKGROUND_COLOR );
scene.fog = new THREE.Fog(BACKGROUND_COLOR, 20, 100);

const canvas = document.querySelector('#c');

// Init the renderer
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});

renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio); 

document.body.appendChild(renderer.domElement);


// Add a camera -------------------> (field of view, width / height, clipping front, clipping back)
var camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = cameraFar;
camera.position.x = 0;


// Initial material
const INITIAL_MTL = new THREE.MeshPhongMaterial( { color: 0xf1f1f1, shininess: 10 } );

const INITIAL_MAP = [
	{childID: "back", mtl: INITIAL_MTL},
	{childID: "base", mtl: INITIAL_MTL},
	{childID: "cushions", mtl: INITIAL_MTL},
	{childID: "legs", mtl: INITIAL_MTL},
	{childID: "supports", mtl: INITIAL_MTL},
];


// Init the object loader
var loader = new THREE.GLTFLoader();

loader.load(MODEL_PATH, function(gltf) {
	theModel = gltf.scene;

	theModel.traverse((o) => {
		if (o.isMesh) {
			o.castShadow = true;
			o.receiveShadow = true;
		}
	});

	// Set the models initial scale   
	theModel.scale.set(2,2,2);
	// Rotate 180° on the y 
	theModel.rotation.y = Math.PI;

	// Offset the y position a bit
	theModel.position.y = -1;


	// Set initial textures
	for (let object of INITIAL_MAP) {
		initColor(theModel, object.childID, object.mtl);
	}


	// Add the model to the scene
	scene.add(theModel);

}, undefined, function(error) {
	console.error(error)
});


// Function - Add the textures to the models
function initColor(parent, type, mtl) {
	parent.traverse((o) => {
		if (o.isMesh) {
			if (o.name.includes(type)) {
				o.material = mtl;
				o.nameID = type; // Set a new property to identify this object
			}
		}
	});
}


// Add lights
var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.61 );
	hemiLight.position.set( 0, 50, 0 );
// Add hemisphere light to scene   
scene.add( hemiLight );

var dirLight = new THREE.DirectionalLight( 0xffffff, 0.54 );
	dirLight.position.set( -8, 12, 8 );
	dirLight.castShadow = true;
	dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
// Add directional Light to scene    
	scene.add( dirLight );


// Add floor
var floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
var floorMaterial = new THREE.MeshPhongMaterial({
  color: 0xeeeeee,
  shininess: 0
});

var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -0.5 * Math.PI;
floor.receiveShadow = true;
floor.position.y = -1;
scene.add(floor);


// Add controls
var controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.maxPolarAngle = Math.PI / 2;
controls.minPolarAngle = Math.PI / 3;
controls.enableDamping = true;
controls.enablePan = false;
controls.dampingFactor = 0.1;
controls.autoRotate = false; // Toggle this if you'd like the chair to automatically rotate
controls.autoRotateSpeed = 0.2; // 30


// update loop: function that runs on each frame draw, really important to the way our app will work
function animate() {
	renderer.render(scene, camera);
	requestAnimationFrame(animate);

	controls.update();
	
	if (resizeRendererToDisplaySize(renderer)) {
		const canvas = renderer.domElement;
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();
	}
}
// the update function:
animate();


function resizeRendererToDisplaySize(renderer) {
	const canvas = renderer.domElement;
	var width = window.innerWidth;
	var height = window.innerHeight;
	var canvasPixelWidth = canvas.width / window.devicePixelRatio;
	var canvasPixelHeight = canvas.height / window.devicePixelRatio;

	const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height;
	if (needResize) {
		renderer.setSize(width, height, false);
	}
	return needResize;
}


// Function - Build Colors
function buildColors(colors) {
	for (let [i, color] of colors.entries()) {
		let swatch = document.createElement('div');
		swatch.classList.add('tray__swatch');

		if (color.texture) {
			swatch.style.backgroundImage = "url(" + color.texture + ")";   
		} else {
			swatch.style.background = "#" + color.color;
		}

		swatch.setAttribute('data-key', i);
		TRAY.append(swatch);
	}
}
buildColors(colors);


// Select Option
const options = document.querySelectorAll(".option");

for (const option of options) {
	option.addEventListener('click',selectOption);
}

function selectOption(e) {
	let option = e.target;
	activeOption = e.target.dataset.option;

	for (const otherOption of options) {
		otherOption.classList.remove('--is-active');
	}

	option.classList.add('--is-active');
}


// Swatches
const swatches = document.querySelectorAll(".tray__swatch");

for (const swatch of swatches) {
  swatch.addEventListener('click', selectSwatch);
}


function selectSwatch(e) {
	let color = colors[parseInt(e.target.dataset.key)];
	let new_mtl;

	new_mtl = new THREE.MeshPhongMaterial({
		color: parseInt('0x' + color.color),
		shininess: color.shininess ? color.shininess : 10
	});

	setMaterial(theModel, activeOption, new_mtl);
}


function setMaterial(parent, type, mtl) {
	parent.traverse((o) => {
		if (o.isMesh && o.nameID != null) {
			if (o.nameID == type) {
				o.material = mtl;
			}
		}
	});
}