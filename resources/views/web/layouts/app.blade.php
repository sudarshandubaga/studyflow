<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $school->name }}</title>

    <!-- Bootstrap 5 CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

    <style>
        body {
            font-family: Arial, sans-serif;
        }

        .hero {
            background: url('https://images.unsplash.com/photo-1588072432836-e10032774350') center/cover no-repeat;
            height: 90vh;
            color: white;
            display: flex;
            align-items: center;
            text-align: center;
        }

        .hero h1 {
            font-size: 3rem;
            font-weight: bold;
        }

        .section-title {
            margin-bottom: 30px;
        }

        footer {
            background: #222;
            color: #aaa;
            padding: 20px 0;
        }
    </style>
</head>

<body>

    <header>
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    @if($school->logo)
                        <img src="{{ $school->logo }}" alt="{{ $school->name }}">
                    @else
                        <a href="{{ route('home') }}" class="py-3 d-inline-block">{{ $school->name }}</a>
                    @endif
                </div>
                <div class="col-md-6">
                </div>
            </div>
        </div>
    </header>

    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand d-md-none" href="#">{{ $school->name }}</a>
            <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item"><a class="nav-link" href="#">Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="#about">About</a></li>
                    <li class="nav-item"><a class="nav-link" href="#courses">Programs</a></li>
                    <li class="nav-item"><a class="nav-link" href="#gallery">Gallery</a></li>
                    <li class="nav-item"><a class="nav-link" href="#contact">Contact</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <h1>Welcome to Our School</h1>
            <p class="lead">Empowering students for a brighter future</p>
            <a href="#contact" class="btn btn-warning btn-lg">Enroll Now</a>
        </div>
    </section>

    <!-- About -->
    <section id="about" class="py-5">
        <div class="container text-center">
            <h2 class="section-title">About Us</h2>
            <p>Our school provides quality education with modern facilities and experienced teachers. We focus on
                academic excellence and overall development of students.</p>
        </div>
    </section>

    <!-- Programs -->
    <section id="courses" class="py-5 bg-light">
        <div class="container text-center">
            <h2 class="section-title">Our Programs</h2>
            <div class="row">
                <div class="col-md-4">
                    <div class="card p-3">
                        <h5>Primary Education</h5>
                        <p>Strong foundation for young learners.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card p-3">
                        <h5>Secondary Education</h5>
                        <p>Focused academic excellence.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card p-3">
                        <h5>Sports & Activities</h5>
                        <p>Encouraging physical and creative growth.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Gallery -->
    <section id="gallery" class="py-5">
        <div class="container text-center">
            <h2 class="section-title">Gallery</h2>
            <div class="row g-3">
                <div class="col-6 col-md-3">
                    <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7" class="img-fluid rounded">
                </div>
                <div class="col-6 col-md-3">
                    <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1" class="img-fluid rounded">
                </div>
                <div class="col-6 col-md-3">
                    <img src="https://images.unsplash.com/photo-1584697964403-66c6a7b6c8f6" class="img-fluid rounded">
                </div>
                <div class="col-6 col-md-3">
                    <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da" class="img-fluid rounded">
                </div>
            </div>
        </div>
    </section>

    <!-- Contact -->
    <section id="contact" class="py-5 bg-light">
        <div class="container">
            <h2 class="text-center section-title">Contact Us</h2>
            <div class="row">
                <div class="col-md-6">
                    <input type="text" class="form-control mb-3" placeholder="Your Name">
                    <input type="email" class="form-control mb-3" placeholder="Your Email">
                    <textarea class="form-control mb-3" rows="4" placeholder="Message"></textarea>
                    <button class="btn btn-primary">Send Message</button>
                </div>
                <div class="col-md-6">
                    <h5>Address</h5>
                    <p>Your School Address, City</p>
                    <h5>Email</h5>
                    <p>info@school.com</p>
                    <h5>Phone</h5>
                    <p>+91 9876543210</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="text-center">
        <div class="container">
            <p>© 2026 My School. All rights reserved.</p>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

</body>

</html>