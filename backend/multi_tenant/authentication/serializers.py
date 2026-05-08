from rest_framework import serializers

class LoginSerializer(serializers.Serializer):


    company = serializers.CharField()

    email = serializers.EmailField()

    password = serializers.CharField()

