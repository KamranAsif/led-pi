import http from 'http';
import assert from 'assert';
import {Observable} from 'rxjs';

// From https://github.com/KamranAsif/esp-cam/blob/master/EspCam/EspCam.ino#L27
const BOUNDARY_BUFFER = Buffer.from('123456789000000000000987654321');
const CONTENT_TYPE_BUFFER = Buffer.from('Content-Type: image/jpeg');
const ESP32CAM_URL = 'http://esp32cam.local';

// Returns an observable that emits image buffers.
export function getEsp32CamBuffer$() {
  return new Observable<Buffer>(subscriber => {
    const req = http.request(ESP32CAM_URL, res => {
      let buffer = Buffer.from('');

      res.on('data', part => {
        const isBoundary = part.includes(BOUNDARY_BUFFER);

        // Emit buffer and reset.
        if (isBoundary) {
          subscriber.next(buffer);
          buffer = Buffer.from('');
          return;
        }

        if (part.includes(CONTENT_TYPE_BUFFER)) {
          // Don't include content header in buffer.
          // Also assert that we have correctly hit boundary before.
          assert(buffer.length === 0, 'buffer should be empty');
        } else {
          //Append to buffer
          buffer = Buffer.concat([buffer, part]);
        }
      });
    });

    // Stop request on Observable teardown.
    subscriber.add(() => req.end());
  });
}
