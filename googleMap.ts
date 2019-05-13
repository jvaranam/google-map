import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';

import { Geolocation } from '@ionic-native/geolocation';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Diagnostic } from '@ionic-native/diagnostic';

declare var google;
declare var MarkerWithLabel;

@Injectable()
export class GMapProvider {
  private geocoder: any;
  private bounds: any;
  private autocomplete: any;
  constructor(private diagnostic: Diagnostic, private locationAccuracy: LocationAccuracy, private geolocation: Geolocation) { }


  public getLocationStatus() {
    return new Promise((resolve, reject) => {
      this.diagnostic.isLocationEnabled().then((isAvailable) => {
        if (isAvailable) {
          resolve(true);
        } else {
          reject(false);
        }
      }, (error) => {
        reject(false);
      })
    })
  }

  public getLocation() {
    return new Promise((resolve, reject) => {
      this.geolocation.getCurrentPosition({ maximumAge: 3000, timeout: 5000, enableHighAccuracy: true }).then((resp) => {
        resolve({ "lat": resp.coords.latitude, "lng": resp.coords.longitude });
      }).catch((error) => {
        reject(error);
      });
    })
  }

  public enableLocationServices() {
    return new Promise((resolve, reject) => {
      this.diagnostic.requestLocationAuthorization("always").then((enabled) => {
        if (enabled == "GRANTED" || enabled) {
          resolve(true);
        } else if (enabled == "DENIED" || enabled == false) {
          reject(false);
        }
      }, (error) => {
        reject(false);
      })
    })
  }

  public getLocationAccuracy() {
    return new Promise((resolve, reject) => {
      this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then((resp) => {
        resolve("success" + resp);
      }, (error) => {
        reject("error" + error)
      })
    })
  }

  public loadGMap(_paramId, _paramLatLng, _zoom) {
    return new google.maps.Map(document.getElementById(_paramId), {
      zoom: _zoom,
      center: new google.maps.LatLng(_paramLatLng.lat, _paramLatLng.lng),
      //mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      //zoomControl: false,
      disableDefaultUI: true
    });
  }

  public updateLocation(_map, _latLng) {
    _map.panTo(_latLng);
  }

  public loadMarkers(_map, _latLng, _svgName, _textContent, _labelClass, _visibility, _id) {
    return new MarkerWithLabel({
      position: _latLng,
      animation: google.maps.Animation.DROP,
      map: _map,
      labelContent: _textContent,
      labelAnchor: new google.maps.Point(-13, 18),
      labelClass: _labelClass,
      icon: {
        anchor: new google.maps.Point(_latLng.lat, _latLng.lng),
        size: new google.maps.Size(50, 73),
        url: 'assets/images/' + _svgName + '.svg'
      },
      visible: _visibility,
      _id: _id
    })
  }

  public loadCircle(_map, _latLng, _radius, _clickable, _sColor, _sOpacity, _sWidth, _fColor, _fOpacity) {
    return new google.maps.Circle({
      center: _latLng,
      map: _map,
      radius: _radius,
      strokeColor: _sColor,
      strokeOpacity: _sOpacity,
      strokeWeight: _sWidth,
      fillColor: _fColor,
      fillOpacity: _fOpacity,
      clickable: _clickable,
    });
  }

  public changeCircleColor(_circle, _color) {
    _circle.setOptions({
      strokeColor: _color,
      fillColor: _color,
    });
  }

  public getGeocode(_address) {
    if (!this.geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }
    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ 'address': _address }, (results, status) => {
        if (status === 'OK') {
          //if(results.length > 0 && results[0].geometry){
          resolve(results[results.length - 1].geometry.location);
    			/*}else{
    				reject(results);
    			}*/
        } else {
          reject(status);
        }
      })
    })
  }

  public getMyAddress(_latlng) {
    if (!this.geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }
    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ 'location': _latlng }, (results, status) => {
        if (status === 'OK') {
          if (results[0]) {
            resolve(results[0])
          } else {
            reject("No address found");
          }
        } else {
          reject("No address found" + status);
        }
      });
    })
  }

  public getBounds(_markers, _map) {
    if (!this.bounds) {
      this.bounds = new google.maps.LatLngBounds();
    }
    return new Promise((resolve, reject) => {
      for (var i = 0; i < _markers.length; i++) {
        console.log(i);
        this.bounds.extend(_markers[i].getPosition());
      }
      _map.setCenter(this.bounds.getCenter());
      _map.fitBounds(this.bounds);
      window.setTimeout(() => {
        _map.setZoom(_map.getZoom() - 1);
      }, 1000);
      resolve();
    });
  }

  public getBoundsStatus(_circle, _latLng) {
    return new Promise((resolve, reject) => {
      let bounds = _circle.getBounds();
      if (bounds.contains(_latLng.getPosition())) {
        resolve(true);
      } else {
        reject(false);
      }
    })
  }

  public autocompleteAddress() {
    if (this.autocomplete) {
      this.autocomplete = null;
    }
    var options = {
      types: ['establishment']
    };
    this.autocomplete = new google.maps.places.Autocomplete(document.getElementById("autoSearch"));
    return new Promise((resolve, reject) => {
      this.autocomplete.addListener('place_changed', () => {
        let place = this.autocomplete.getPlace();
        resolve(place.formatted_address);
      }, (error) => {
        reject(error);
      });
    })
  }

  public autocompleteAddress1(_queryParam): Observable<any> {
    if (!this.autocomplete) {
      this.autocomplete = new google.maps.places.AutocompleteService();
    }
    return new Observable((sub: any) => {
      this.autocomplete.getQueryPredictions({ input: _queryParam, types: ['address'], componentRestrictions: { country: 'all' } }, (predictions, status) => {
        if (status == "OK") {
          sub.next(predictions);
          sub.complete(predictions);
        } else {
          sub.error({ message: "not found any matching" });
        }
      })
    });
  }

  public getElementById(_arrObj, _obj, _elementId) {
    return new Promise((resolve, reject) => {
      _arrObj.find((element, index) => {
        if (element[_elementId] == _obj[_elementId]) {
          resolve(element);
        }
      })
      reject(null);
    })
  }

  public spliceObjectFromArray(_array, _obj, _elementId) {
    return new Promise((resolve, reject) => {
      _array.find((element, index) => {
        if (element[_elementId] == _obj[_elementId]) {
          _array.splice(index, 1);
          resolve(_array);
        }
      })
      reject();
    })
  }

  public updateElement(_array, _obj, _elementId, _updatedParams) {
    return new Promise((resolve, reject) => {
      _array.find((element, index) => {
        if (element[_elementId] == _obj[_elementId]) {
          for (var i in element) {
            if (_updatedParams[i]) {
              element[i] = _updatedParams[i];
            }
          }
          resolve(_array);
        }
      })
      reject(null);
    })
  }

  public splicedObjectNdRemainingObj(_array, _obj, _elementId) {
    let splicedObj: any = null;
    return new Promise((resolve, reject) => {
      _array.find((element, index) => {
        if (element[_elementId] == _obj[_elementId]) {
          splicedObj = _array[index];
          _array.splice(index, 1);
          resolve({ "splicedObj": splicedObj, "remainingObj": _array });
        }
      })
      reject();
    })
  }

  public getOrdinal(n) {
    var s = ["th", "st", "nd", "rd"],
      v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  public alertCtrlChecked(_arr, _value) {
    for (var i in _arr) {
      if (_arr[i].value == _value) {
        _arr[i].checked = true;
      } else {
        _arr[i].checked = false;
      }
    }
  }
  /*function arePointsNear(checkPoint, centerPoint, km) {
  var ky = 40000 / 360;
  var kx = Math.cos(Math.PI * centerPoint.lat / 180.0) * ky;
  var dx = Math.abs(centerPoint.lng - checkPoint.lng) * kx;
  var dy = Math.abs(centerPoint.lat - checkPoint.lat) * ky;
  return Math.sqrt(dx * dx + dy * dy) <= km;
}*/
}
