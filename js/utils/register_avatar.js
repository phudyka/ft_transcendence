document.addEventListener('DOMContentLoaded', () => {
	const prev = document.getElementById('left_click')
	const next = document.getElementById('right_click')
	const container = document.getElementById('avatars')
	const avatars = document.querySelectorAll('.avatars-container > .avatar-item')
	let currentIndex = Math.floor(avatars.length/2)
	const val = (avatars.length - 1 - Math.floor(avatars.length/2)) * 195
	let translateVal = 0

	for (let i = 0; i < avatars.length; i++) {
	  if (i === Math.floor(avatars.length/2)) {
		avatars[i].classList.add('current')
	  }
	}

	let defaultVal = 0
	if (avatars.length % 2 === 0) {
	  defaultVal = 90
	  translateVal -= 90
	  container.style.transform = `translateX(${translateVal}px)`
	}

	prev.addEventListener('click', () => {
	  console.log("prev clicked")
	  if (currentIndex - 1 < 0) {
		avatars[currentIndex].classList.remove('current')
		avatars[avatars.length - 1].classList.add('current')
		currentIndex = avatars.length - 1
		translateVal = -val - defaultVal
		container.style.transform = `translateX(${translateVal}px)`
	  } else {
		avatars[currentIndex].classList.remove('current')
		avatars[currentIndex - 1].classList.add('current')
		currentIndex -= 1
		translateVal += 195
		container.style.transform = `translateX(${translateVal}px)`
	  }
	})

	next.addEventListener('click', () => {
	  console.log("prev clicked")
	  if (currentIndex + 1 >= avatars.length) {
		avatars[currentIndex].classList.remove('current')
		avatars[0].classList.add('current')
		currentIndex = 0
		translateVal = val + defaultVal
		container.style.transform = `translateX(${translateVal}px)`
		return
	  }
	  avatars[currentIndex].classList.remove('current')
	  avatars[currentIndex + 1].classList.add('current')
	  currentIndex += 1
	  translateVal -= 195
	  container.style.transform = `translateX(${translateVal}px)`
	})
  })
