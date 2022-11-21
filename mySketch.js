
// Controls:
// 	- Drag the mouse.
//     - Press any key to toggle between fill and stroke.


////////////////////////// Posenet
var video;
var poseNet;
var poses = [];



var allParticles = [];
var maxLevel = 1;
var useFill = false;

var data = [];



function Particle(x, y, level) {
  this.level = level;
  this.life = 0;
  
  this.pos = new p5.Vector(x, y);
  this.vel = p5.Vector.random2D();
  this.vel.mult(map(this.level, 0, maxLevel, 5, 4));
  
  this.move = function() {
    this.life++;
    
    this.vel.mult(0.9);
    
    this.pos.add(this.vel);
    
    if (this.life % 10 == 0) {
      if (this.level > 0) {
        this.level -= 1;
        var newParticle = new Particle(this.pos.x, this.pos.y, this.level-1);
        allParticles.push(newParticle);
      }
    }
  }
}


function setup() {
  createCanvas(displayWidth, displayHeight); 
  // createCanvas(windowWidth, windowHeight); 
  colorMode(HSB, 255);
  
  textAlign(CENTER);
  
  background(0);
	
	//////////Posenet
	video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  poseNet = ml5.poseNet(video, modelReady);
  poseNet.on("pose", function(results) {
    poses = results;
  });
  video.hide();
} 


function draw() {
	translate(width,0);
  scale(-1, 1);
	// image(video, 0, 0, width, height);
	
  noStroke();
  fill(0, 30);
  rect(0, 0, width, height);

  
  for (var i = allParticles.length-1; i > -1; i--) {
    allParticles[i].move();
    
    if (allParticles[i].vel.mag() < 0.01) {
      allParticles.splice(i, 1);
    }
  }
  
  if (allParticles.length > 0) {
    // Run script to get points to create triangles with.
    data = Delaunay.triangulate(allParticles.map(function(pt) {
      return [pt.pos.x, pt.pos.y];
    }));
  	
    strokeWeight(0.1);
    
    for (var i = 0; i < data.length; i += 3) {
      var p1 = allParticles[data[i]];
      var p2 = allParticles[data[i+1]];
      var p3 = allParticles[data[i+2]];
      
      var distThresh = 100;
      
      if (dist(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y) > distThresh) {
        continue;
      }
      
      if (dist(p2.pos.x, p2.pos.y, p3.pos.x, p3.pos.y) > distThresh) {
        continue;
      }
      
      if (dist(p1.pos.x, p1.pos.y, p3.pos.x, p3.pos.y) > distThresh) {
        continue;
      }
      
      if (useFill) {
        noStroke();
        fill(165+p1.life*1, 250, 360);
      } else {
        noFill();
        stroke(165+p1.life*1, 250, 360);
      }
      
      triangle(p1.pos.x, p1.pos.y, 
               p2.pos.x, p2.pos.y, 
               p3.pos.x, p3.pos.y);
    }
  }
  
  noStroke();
  fill(255,0,0);
  text("", width/2, height-50);
  drawKeypoints();
}

function drawKeypoints() {
  for (let i = 0; i < poses.length; i += 1) {
    const pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j += 1) {
      const keypoint = pose.keypoints[j];
      if (keypoint.score > 0.4) {
        fill(150, 360, 360, 25);
        noStroke();
				allParticles.push(new Particle(keypoint.position.x, keypoint.position.y, maxLevel));
        ellipse(keypoint.position.x, keypoint.position.y, 30, 30);
      }
    }
  }
}

function drawSkeleton() {
  for (let i = 0; i < poses.length; i += 1) {
    const skeleton = poses[i].skeleton;
    for (let j = 0; j < skeleton.length; j += 1) {
      const partA = skeleton[j][0];
      const partB = skeleton[j][1];
      stroke(360, 360, 360);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}


function mouseDragged() {
  allParticles.push(new Particle(mouseX, mouseY, maxLevel));
}


function keyPressed() {
  useFill = ! useFill;
}

function modelReady() {
  // select('#status').html('Model Loaded');
}

function mousePressed(){
  console.log(JSON.stringify(poses))
}