/**
 * return uuids
 * 
 * 
 * Thanks to https://stackoverflow.com/a/64976228
 */
function uuid4() {
    let array = new Uint8Array(16)
    crypto.getRandomValues(array)
  
    // manipulate 9th byte
    array[8] &= 0b00111111 // clear first two bits
    array[8] |= 0b10000000 // set first two bits to 10
  
    // manipulate 7th byte
    array[6] &= 0b00001111 // clear first four bits
    array[6] |= 0b01000000 // set first four bits to 0100
  
    const pattern = "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
    let idx = 0
  
    return pattern.replace(
      /XX/g,
      () => array[idx++].toString(16).padStart(2, "0"), // padStart ensures leading zero, if needed
    )
  }

  export default uuid4;