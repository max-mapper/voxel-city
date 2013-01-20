var createGame = require('voxel-engine')
var toolbar = require('toolbar')
var heightmap = require('./png-heightmap')
var url = require('url')

var blockSelector = toolbar({el: '#tools'})
var chunkDistance = 2
var chunkSize = 32
var container = document.querySelector('#container')

var parsedURL = url.parse(window.location.href, true)
if (parsedURL.query && parsedURL.query.lat && parsedURL.query.lon) {
  showVoxelTerrain(parsedURL.query.lat, parsedURL.query.lon, parsedURL.query.zoom)
} else {
  navigator.geolocation.getCurrentPosition(
    function(position) {
      var lat = position.coords.latitude
      var lon = position.coords.longitude
      showVoxelTerrain(lat, lon)
    }, function(error) {
      alert(error)
    }, {timeout:10000}
  )
}

function showVoxelTerrain(lat, lon, zoom) {
  zoom = zoom || 18
  var pngURL
  if (parsedURL.query.url) pngURL = parsedURL.query.url
  else pngURL = 'http://a.tiles.mapbox.com/v3/dmt.sf_building/' + lon + ',' + lat + ',' + zoom + '/640x640.png'

  heightmap(pngURL, chunkDistance * 2 * chunkSize , function(err, pngGenerate) {
    window.game = createGame({
      generate: pngGenerate,
      startingPosition: [0, 500, 0],
      materials: ['grass', 'brick', 'dirt']
    })
    game.controls.pitchObject.rotation.x = -1.5;
    game.controls.yawObject.position.z += 500;
    game.appendTo(container)
    container.addEventListener('click', function() {
      game.requestPointerLock(container)
    })
    
    var currentMaterial = 1

    blockSelector.on('select', function(material) {
      var idx = game.materials.indexOf(material)
      if (idx > -1) currentMaterial = idx + 1
    })

    game.on('collision', function (item) {
      game.removeItem(item)
    })
    
    THREE = game.THREE

    function createDebris (pos, value) {
      var mesh = new THREE.Mesh(
        new THREE.CubeGeometry(4, 4, 4),
        game.material
      )
      mesh.geometry.faces.forEach(function (face) {
        face.materialIndex = value - 1
      })
      mesh.translateX(pos.x)
      mesh.translateY(pos.y)
      mesh.translateZ(pos.z)

      return {
        mesh: mesh,
        size: 4,
        collisionRadius: 22,
        value: value
      }
    }

    function explode (pos, value) {
      if (!value) return
      var item = createDebris(pos, value)
      item.velocity = {
        x: (Math.random() * 2 - 1) * 0.05,
        y: (Math.random() * 2 - 1) * 0.05,
        z: (Math.random() * 2 - 1) * 0.05,
      }
      game.addItem(item)
      setTimeout(function (item) {
        game.removeItem(item)
      }, 15 * 1000 + Math.random() * 15 * 1000, item)
    }

    game.appendTo('#container')


    game.on('mousedown', function (pos) {
      var cid = game.voxels.chunkAtPosition(pos)
      var vid = game.voxels.voxelAtPosition(pos)
      if (erase) {
        explode(pos, game.getBlock(pos))
        game.setBlock(pos, 0)
      } else {
        game.createBlock(pos, currentMaterial)
      }
    })

    var erase = true
    window.addEventListener('keydown', function (ev) {
      if (ev.keyCode === 'X'.charCodeAt(0)) {
        erase = !erase
      }
    })

    function ctrlToggle (ev) { erase = !ev.ctrlKey }
    window.addEventListener('keyup', ctrlToggle)
    window.addEventListener('keydown', ctrlToggle)
  })
}

