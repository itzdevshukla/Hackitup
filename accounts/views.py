from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import login as auth_login, authenticate,logout as auth_logout
from django.contrib import messages


def register(request):
    
    if request.method == 'POST':
        email = request.POST.get('email')
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already taken!')
            return render(request, "home/register.html")
        
        user = User.objects.create_user(username=username, email=email, password=password)
        auth_login(request, user)
        messages.success(request, f'Welcome {username}!')
        return redirect('dashboard')  # ✅ URL name use karo
    
    return render(request, "home/register.html")


from django.shortcuts import redirect, render
from django.contrib.auth import authenticate, login as auth_login
from django.contrib import messages

def login(request):

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            auth_login(request, user)
            messages.success(request, f'Welcome back {username}!')

            # 🚀 SUPERUSER REDIRECT
            if user.is_superuser or user.is_staff:
                return redirect('admin_dashboard')   # Custom Admin

            # 🚀 NORMAL USER REDIRECT
            return redirect('dashboard')

        else:
            messages.error(request, 'Invalid credentials!')

    return render(request, "home/login.html")



def logout(request):
    username = request.user.username
    auth_logout(request)
    messages.success(request, f'See you later, {username}! 👋')
    return redirect('/')