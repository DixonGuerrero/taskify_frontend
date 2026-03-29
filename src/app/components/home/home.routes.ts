import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { RoadmapComponent } from './pages/roadmap/roadmap.component';
import { PricingComponent } from './pages/pricing/pricing.component';

export const homeRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'roadmap', component: RoadmapComponent
            },
            {
                path: 'pricing', component: PricingComponent
            },
            {
                path: 'landing', component: LandingComponent
            },
            {
                path: '**', redirectTo: 'landing'
            }
        ]
    }
];