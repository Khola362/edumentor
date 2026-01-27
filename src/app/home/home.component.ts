import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isScrolled = false;
  isMenuOpen = false;

  // Remove courses array

  testimonials = [
    {
      name: 'Alex Morgan',
      role: 'Computer Science Student',
      avatar: 'https://i.pravatar.cc/150?img=8',
      text: 'eduLLM transformed how I study. The AI explanations are incredibly clear and help me grasp complex concepts faster than any textbook.',
      date: '2 weeks ago',
      rating: 5
    },
    {
      name: 'Dr. Sarah Chen',
      role: 'University Professor',
      avatar: 'https://i.pravatar.cc/150?img=5',
      text: 'As an educator, I\'m impressed with how eduLLM personalizes learning. It\'s like having a teaching assistant for every student.',
      date: '1 month ago',
      rating: 5
    },
    {
      name: 'Marcus Johnson',
      role: 'Career Changer',
      avatar: 'https://i.pravatar.cc/150?img=11',
      text: 'Switched careers at 35. eduLLM made learning new skills manageable with bite-sized, AI-powered lessons that adapt to my pace.',
      date: '3 weeks ago',
      rating: 5
    }
  ];

  features = [
    {
      icon: 'auto_awesome',
      title: 'AI-Powered Learning',
      description: 'Get instant explanations and personalized study paths powered by advanced AI'
    },
    {
      icon: 'psychology',
      title: 'Smart Tutor 24/7',
      description: 'Ask questions anytime and get detailed, contextual answers from our AI tutor'
    },
    // {
    //   icon: 'timeline',
    //   title: 'Progress Tracking',
    //   description: 'Visual analytics show your learning journey and highlight areas for improvement'
    // },
    {
      icon: 'groups',
      title: 'Community Learning',
      description: 'Join study groups and collaborate with peers in interactive learning sessions'
    }
  ];

  constructor() { }

  ngOnInit(): void {
    this.checkScroll();
    this.checkLoginStatus();
  }
  checkLoginStatus(): void {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      console.log('User is logged in:', userData);

      // You can update UI based on login status
      // For example, change "Sign In" to "Dashboard" if logged in
    }
  }
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.checkScroll();
  }

  checkScroll(): void {
    this.isScrolled = window.pageYOffset > 50;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}