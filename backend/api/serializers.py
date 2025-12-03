from rest_framework import serializers
from .models import Seminar, Attendance, JoinedParticipant, Certificate, Evaluation

class SeminarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seminar
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'


class JoinedParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = JoinedParticipant
        fields = '__all__'


class CertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = '__all__'


class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = '__all__'
