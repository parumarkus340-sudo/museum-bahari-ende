/*
Author       : Theme_Ocean.
Template Name: Hilux - Real Estate HTML Template 
Version      : 1.1 (Updated - Error Free)
*/
(function($) {
	'use strict';
	
	// 🔍 DEBUG: Hapus baris ini setelah error hilang
	console.log("🚀 SUKSES! File scripts.js VERSI BARU sudah dimuat!");
	
	jQuery(document).on('ready', function(){
	
		/*PRELOADER JS*/
		$(window).on('load', function() { 
			$('.status').fadeOut();
			$('.preloader').delay(350).fadeOut('slow'); 
		}); 
		/*END PRELOADER JS*/
		
		/*START MIXITUP JS - DINONAKTIFKAN (Plugin tidak dimuat)*/	
		// if (typeof $.fn.mixitup !== 'undefined') {
		// 	jQuery('#gallery .row').mixitup({
		// 		targetSelector: '.mix',
		// 	});
		// }
		/*END MIXITUP JS*/

		/*START PRETTYPHOTO JS*/
		if (typeof $.fn.prettyPhoto !== 'undefined') {
			$("a[class^='prettyPhoto']").prettyPhoto();
			$("a[data-rel^='prettyPhoto']").prettyPhoto();
		}
		/*END PRETTYPHOTO JS*/

		/*START PORTFOLIO POPUP JS*/
		$('#projectModal').on('shown.bs.modal', function () {
			$('#myInput').focus();
		});
		/*END PORTFOLIO POPUP JS*/

		/*START VIDEO JS - DINONAKTIFKAN (Plugin magnificPopup tidak dimuat)*/
		// if (typeof $.fn.magnificPopup !== 'undefined') {
		// 	$('.video-play').magnificPopup({
		// 		type: 'iframe'
		// 	});
		// }
		/*END VIDEO JS*/		
		  
		/*START PARTNER LOGO*/
		if (typeof $.fn.owlCarousel !== 'undefined') {
			$('.partner').owlCarousel({
				autoPlay: 9000,
				items: 4,
				itemsDesktop: [1199, 3],
				itemsDesktopSmall: [979, 3]
			});
		}
		/*END PARTNER LOGO*/
		
		/*START TESTIMONIAL JS*/	
		if (typeof $.fn.slick !== 'undefined') {
			$('.testimonial1-carousel').slick({
				slidesToShow: 1,
				slidesToScroll: 1,
				arrows: true,
				nextArrow: '<i class="fa fa-chevron-right next"></i>',
				prevArrow: '<i class="fa fa-chevron-left prev"></i>',
				dots: true,
				fade: false,
				autoplay: true,
				autoplaySpeed: 2000,
			});
		}
		/*END TESTIMONIAL JS*/			
	}); 		
	
	/* START PARALLAX JS - DINONAKTIFKAN (Plugin stellar tidak dimuat) */
	// if (typeof $.fn.stellar !== 'undefined') {
	// 	(function () {
	// 		if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) { 
	// 			$(window).stellar({
	// 				horizontalScrolling: false,
	// 				responsive: true
	// 			});
	// 		}
	// 	}());
	// }
	/* END PARALLAX JS  */		
	
	/*START WOW ANIMATION JS*/
	if (typeof WOW !== 'undefined') {
		new WOW().init();	
	}
	/*END WOW ANIMATION JS*/	
				
})(jQuery);
