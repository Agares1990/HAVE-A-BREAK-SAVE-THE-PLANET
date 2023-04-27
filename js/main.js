let canvas;
let engine;
let scene;
let inputStates = {};
let groundSpeed = 0.1;
let distance = 0;

window.onload = startGame;

async function startGame() {
    canvas = document.querySelector("#myCanvas");
    engine = new BABYLON.Engine(canvas, true);
    scene = await createScene();

    modifySettings();

    let Car = scene.getMeshByName("Car");

    const distanceText = document.createElement("div");
    distanceText.id = "distanceText";
    document.body.appendChild(distanceText);

    // Set the style of the distanceText element
    const style = distanceText.style;
    style.position = "absolute";
    style.left = "10px";
    style.top = "10px";
    style.color = "white";
    style.fontSize = "24px";
    style.fontFamily = "Arial";

    engine.runRenderLoop(() => {
        let deltaTime = engine.getDeltaTime();

        Car.move();

        scene.meshes.forEach((mesh) => {
            if (mesh.name == "ground" || mesh.name == "obstacle") {
                mesh.position.z += groundSpeed;
            }
        });

        groundSpeed += 0.001;
       
        // Update distance
        distance += groundSpeed * deltaTime / 1000;
        const distanceText = document.querySelector("#distanceText");
        distanceText.textContent = `Distance: ${distance.toFixed(0)} mètres`;

        scene.render();
    });
}

async function createScene() {
    let scene = new BABYLON.Scene( engine );
    let ground = createGround( scene );
    let itBOX = createitBOX(scene);
  
    let Car = await createCar( scene, itBOX );
    let freeCamera = createFreeCamera( scene, Car );
  
    // second parameter is the target to follow
    let followCamera = createFollowCamera( scene, Car );
    scene.activeCamera = followCamera;
  
    createLights( scene );
  
    // Add obstacles
    function addObstacle() {
        // create first obstacle
        let obstacle1 = createObstacle(scene, itBOX);
        obstacle1.position.z = Car.position.z - 300 - Math.floor(Math.random() * 100); // place the obstacle just in front of the car
        let lane1 = Math.floor(Math.random() * 3); // randomly choose a lane (0, 1, or 2)
        let x1 = -30 + lane1 * 30; // compute the x position based on the lane
        obstacle1.position.x = x1; // set initial position in the lane
    
        // start obstacle1 animation
        scene.beginAnimation(obstacle1, 0, 60, false);
    
        // remove obstacle1 after 10 seconds
        setTimeout(function() {
            obstacle1.dispose();
        }, 10000);
    
        // create second obstacle
        let obstacle2 = createObstacle(scene, itBOX);
        obstacle2.position.z = Car.position.z - 300 - Math.floor(Math.random() * 100); // place the obstacle just in front of the car
        let lane2 = Math.floor(Math.random() * 3); // randomly choose a lane (0, 1, or 2)
        let x2 = -30 + lane2 * 30; // compute the x position based on the lane
        while (x2 == x1) { // make sure the second obstacle is not in the same lane as the first one
            lane2 = Math.floor(Math.random() * 3);
            x2 = -30 + lane2 * 30;
        }
        obstacle2.position.x = x2; // set initial position in the lane
    
        // start obstacle2 animation
        scene.beginAnimation(obstacle2, 0, 60, false);
    
        // remove obstacle2 after 10 seconds
        setTimeout(function() {
            obstacle2.dispose();
        }, 10000);
    }    
    
    // Wait for 15 seconds before adding obstacles
    setTimeout(() => {
        addObstacle();
        setInterval(addObstacle, 6000);
    }, 15000);
  
    return scene;
  }
  

function createGround(scene) {
    const groundOptions = {
        width: 100,
        height: 5000000,
        subdivisions: 20,
        minHeight: 0,
        maxHeight: 0,
        onReady: onGroundCreated
    };
    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("ground", "images/hmap1.png", groundOptions, scene);

    function onGroundCreated() {
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("images/road.png", scene);
        groundMaterial.diffuseTexture.uScale = 1;
        groundMaterial.diffuseTexture.vScale = 50000;
        ground.material = groundMaterial;
        ground.checkCollisions = true;    
    }
    return ground;
}

function createitBOX(scene) {
    let itBOX = BABYLON.Mesh.CreateBox("itBOX", 2, scene);
    itBOX.scaling = new BABYLON.Vector3(6, 2, 14);
    itBOX.visibility = false; // make the box invisible
    itBOX.checkCollisions = true;
    return itBOX;
}

function createObstacle(scene, itBOX) {
    let obstacle = BABYLON.Mesh.CreateBox("obstacle", 2, scene);
    const actionManager = new BABYLON.ActionManager(scene);
        actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                    parameter: { mesh: itBOX },
                },
                (evt) => {
                   console.log("salut")
                   engine.stopRenderLoop();

                }
            )
        );
    obstacle.actionManager = actionManager;
    obstacle.scaling = new BABYLON.Vector3(6, 6, 6);
  
    let lane = Math.floor(Math.random() * 3); // randomly choose a lane (0, 1, or 2)
    let x = -30 + lane * 30; // compute the x position based on the lane
    obstacle.position = new BABYLON.Vector3(x, 50, -100); // set initial position above the scene
  
    obstacle.checkCollisions = true;
  
    let material = new BABYLON.StandardMaterial("obstacleMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(1, 0, 0);
    obstacle.material = material;
  
    // animate the obstacle's fall
    let animation = new BABYLON.Animation("obstacleAnimation", "position.y", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    let keys = [];
    keys.push({frame: 0, value: 50}); // starting position
    keys.push({frame: 60, value: 2}); // ending position
    animation.setKeys(keys);
    obstacle.animations.push(animation);
  
    // remove obstacle after 10 seconds
    setTimeout(function() {
        obstacle.dispose();
    }, 10000);
  
    return obstacle;
}


function createLights( scene )
{
	// i.e sun light with all light rays parallels, the vector is the direction.
	let light0 = new BABYLON.DirectionalLight( "dir0", new BABYLON.Vector3( -1, -1, 0 ), scene );

}

function createFreeCamera( scene )
{
	let camera = new BABYLON.FreeCamera( "freeCamera", new BABYLON.Vector3( 0, 50, 0 ), scene );
	camera.attachControl( canvas );
	// prevent camera to cross ground
	camera.checkCollisions = true;
	// avoid flying with the camera
	camera.applyGravity = true;

	// Add extra keys for camera movements
	// Need the ascii code of the extra key(s). We use a string method here to get the ascii code
	camera.keysUp.push( 'z'.charCodeAt( 0 ) );
	camera.keysDown.push( 's'.charCodeAt( 0 ) );
	camera.keysLeft.push( 'q'.charCodeAt( 0 ) );
	camera.keysRight.push( 'd'.charCodeAt( 0 ) );
	camera.keysUp.push( 'Z'.charCodeAt( 0 ) );
	camera.keysDown.push( 'S'.charCodeAt( 0 ) );
	camera.keysLeft.push( 'Q'.charCodeAt( 0 ) );
	camera.keysRight.push( 'D'.charCodeAt( 0 ) );

	return camera;
}

function createFollowCamera( scene, target )
{
	let camera = new BABYLON.FollowCamera( "CarFollowCamera", target.position, scene, target );

	camera.radius = 20; // how far from the object to follow
	camera.heightOffset = 5; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = 0.1; // how fast to move
	camera.maxCameraSpeed = 5; // speed limit

	return camera;
}

let zMovement = 5;

async function createCar(scene, itBOX) {
    return new Promise(resolve => {
        BABYLON.SceneLoader.ImportMesh("", "./models/", "Car.glb", scene, function(newMeshes) {
            let Car = newMeshes[0];
            Car.name = "Car";
            Car.position.y = 10;
            Car.speed = 1;
            Car.frontVector = new BABYLON.Vector3(0, 0, 1);
            Car.laneIndex = 0; // start at the leftmost lane

            // Define the positions of the lanes
            const lanes = [-30, 0, 30]; // example positions for 3 lanes
            const laneOffset = 5; // distance between lanes
            const leftmostLane = lanes[0];
            const rightmostLane = lanes[lanes.length - 1];

            Car.move = () => {
                let yMovement = 0;

                if (Car.position.y > 2) {
                    zMovement = 0;
                    yMovement = -2;
                }

                if (inputStates.right) {
                    if (Car.laneIndex > 0) { // check if there's a lane to the right
                        Car.laneIndex--;
                        let toPosition = new BABYLON.Vector3(lanes[Car.laneIndex], Car.position.y, Car.position.z);
                        BABYLON.Animation.CreateAndStartAnimation("moveRight", Car, "position", 15, 15, Car.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                        BABYLON.Animation.CreateAndStartAnimation("moveRight", itBOX, "position", 15, 15, itBOX.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    }
                }   
                if (inputStates.left) {
                    if (Car.laneIndex < lanes.length - 1) { // check if there's a lane to the left
                        Car.laneIndex++;
                        let toPosition = new BABYLON.Vector3(lanes[Car.laneIndex], Car.position.y, Car.position.z);
                        BABYLON.Animation.CreateAndStartAnimation("moveLeft", Car, "position", 15, 15, Car.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                        BABYLON.Animation.CreateAndStartAnimation("moveLeft", itBOX, "position", 15, 15, itBOX.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    }
                }
                if (inputStates.down) {
					if (Car.laneIndex == 0 || Car.laneIndex == lanes.length - 1) { // check if there's a lane to the middle
						Car.laneIndex = 1;
						let toPosition = new BABYLON.Vector3(lanes[Car.laneIndex], Car.position.y, Car.position.z);
						BABYLON.Animation.CreateAndStartAnimation("moveMiddle", Car, "position", 15, 15, Car.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                        BABYLON.Animation.CreateAndStartAnimation("moveMiddle", itBOX, "position", 15, 15, itBOX.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

					}
				}				

                // other movements (left, right, etc.) can be added here
            };

            Car.scaling = new BABYLON.Vector3(3, 3, 5);
            Car.rotation.y = Math.PI;
            Car.name = "Car";

            // to be taken into account by collision detection
            Car.checkCollisions = true;

            resolve(Car);
        });
    });
}


function modifySettings() {
    // as soon as we click on the game window, the mouse pointer is "locked"
    // you will have to press ESC to unlock it
    scene.onPointerDown = () => {
        if(!scene.alreadyLocked) {
            console.log("requesting pointer lock");
            canvas.requestPointerLock();
        } else {
            console.log("Pointer already locked");
        }
    }

    document.addEventListener("pointerlockchange", () => {
        let element = document.pointerLockElement || null;
        if(element) {
            // lets create a custom attribute
            scene.alreadyLocked = true;
        } else {
            scene.alreadyLocked = false;
        }
    })

    // key listeners for the Perso
    inputStates.left = false;
    inputStates.right = false;
    inputStates.up = false;
    inputStates.down = false;
    inputStates.space = false;
    
    //add the listener to the main, window object, and update the states
    window.addEventListener('keydown', (event) => {
        if ((event.key === "ArrowLeft") || (event.key === "q")|| (event.key === "Q")) {
           inputStates.left = true;
        } else if ((event.key === "ArrowUp") || (event.key === "z")|| (event.key === "Z")){
           inputStates.up = true;
        } else if ((event.key === "ArrowRight") || (event.key === "d")|| (event.key === "D")){
           inputStates.right = true;
        } else if ((event.key === "ArrowDown")|| (event.key === "s")|| (event.key === "S")) {
           inputStates.down = true;
        }  else if (event.key === " ") {
           inputStates.space = true;
        }
    }, false);

    //if the key will be released, change the states object 
    window.addEventListener('keyup', (event) => {
        if ((event.key === "ArrowLeft") || (event.key === "q")|| (event.key === "Q")) {
           inputStates.left = false;
        } else if ((event.key === "ArrowUp") || (event.key === "z")|| (event.key === "Z")){
           inputStates.up = false;
        } else if ((event.key === "ArrowRight") || (event.key === "d")|| (event.key === "D")){
           inputStates.right = false;
        } else if ((event.key === "ArrowDown")|| (event.key === "s")|| (event.key === "S")) {
           inputStates.down = false;
        }  else if (event.key === " ") {
           inputStates.space = false;
        }
    }, false);
}