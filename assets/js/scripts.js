/*
Author       : Theme_Ocean.
Template Name: Hilux - Real Estate HTML Template 
Version      : 1.2 (Final - Error Free)
*/
(function($) {
	'use strict';
	
	console.log("🚀 scripts.js v1.2 dimuat - versi bebas error");
	
	jQuery(document).on('ready', function(){
	
		/*PRELOADER JS*/
		try {
			$(window).on('load', function() { 
				$('.status').fadeOut();
				$('.preloader').delay(350).fadeOut('slow'); 
			}); 
		} catch(e) { console.log("Preloader skipped"); }
		/*END PRELOADER JS*/
		
		/*MIXITUP - DINONAKTIFKAN*/
		// jQuery('#gallery .row').mixitup({ targetSelector: '.mix' });
		
		/*PRETTYPHOTO - DINONAKTIFKAN*/
		// $("a[class^='prettyPhoto']").prettyPhoto();
		// $("a[data-rel^='prettyPhoto']").prettyPhoto();

		/*PORTFOLIO POPUP*/
		try {
			$('#projectModal').on('shown.bs.modal', function () {
				$('#myInput').focus();
			});
		} catch(e) {}

		/*VIDEO - DINONAKTIFKAN*/
		// $('.video-play').magnificPopup({ type: 'iframe' });
		  
		/*PARTNER LOGO*/
		try {
			if (typeof $.fn.owlCarousel !== 'undefined') {
				$('.partner').owlCarousel({
					autoPlay: 9000,
					items: 4,
					itemsDesktop: [1199, 3],
					itemsDesktopSmall: [979, 3]
				});
			}
		} catch(e) { console.log("OwlCarousel skipped"); }
		
		/*TESTIMONIAL*/
		try {
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
		} catch(e) { console.log("Slick skipped"); }
	}); 		
	
	/* PARALLAX - DINONAKTIFKAN */
	// $(window).stellar({ horizontalScrolling: false, responsive: true });
	
	/*WOW ANIMATION*/
	try {
		if (typeof WOW !== 'undefined') {
			new WOW().init();	
		}
	} catch(e) { console.log("WOW skipped"); }
				
})(jQuery);
